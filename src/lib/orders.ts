// Orders and their stock reservations. Every state change here is a single
// conditional statement (or one db.batch transaction), so it's safe to run
// twice: duplicate webhooks, retries and races leave the data unchanged.

import "server-only";
import { and, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders, stock } from "@/db/schema";
import type { Cart } from "./cart";
import type { SessionUser } from "./session";
import { stripe } from "./stripe";

/** How long stock stays reserved for an unpaid order. Stripe's session expires first. */
const RESERVATION_MINUTES = 35;
/** Grace after expires_at before the sweep releases an order the webhook missed. */
const SWEEP_GRACE_MINUTES = 5;

/** Postgres constraint name behind a (possibly wrapped) driver error. */
function violatedConstraint(error: unknown): string | undefined {
  for (let e: unknown = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    const constraint = (e as { constraint?: unknown }).constraint;
    if (typeof constraint === "string") return constraint;
  }
}

/**
 * Create a pending order for the cart and reserve its stock, all or nothing:
 * one transaction inserts the order and its items and decrements each stock
 * row. If any row would go below zero, stock_quantity_check fails and the
 * whole batch rolls back, so stock can't be oversold.
 *
 * Unit prices come from the cart, which is built from live database rows
 * (never from the client); line totals and the order total are computed
 * here. A cart with stock issues is refused: the shopper must review it.
 */
export async function reserveOrder(user: SessionUser, cart: Cart) {
  if (cart.lines.length === 0 || cart.lines.some((line) => line.issue)) {
    return { ok: false as const, reason: "changed" as const };
  }
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
  const lines = cart.lines.map((line) => ({
    orderId: id,
    stockId: line.stockId,
    productId: line.productId,
    productName: line.name,
    size: line.size,
    image: line.image,
    unitPriceCents: line.priceCents,
    quantity: line.quantity,
    lineTotalCents: line.priceCents * line.quantity,
  }));
  // Delivery is complimentary and tax isn't collected yet.
  const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  try {
    await db.batch([
      db.insert(orders).values({
        id,
        userId: user.id,
        email: user.email,
        subtotalCents: totalCents,
        totalCents,
        expiresAt,
      }),
      db.insert(orderItems).values(lines),
      ...cart.lines.map((line) =>
        db
          .update(stock)
          .set({ quantity: sql`${stock.quantity} - ${line.quantity}` })
          .where(eq(stock.id, line.stockId)),
      ),
    ]);
  } catch (error) {
    if (violatedConstraint(error) === "stock_quantity_check") {
      return { ok: false as const, reason: "sold_out" as const };
    }
    throw error;
  }

  return { ok: true as const, order: { id, expiresAt, totalCents } };
}

export async function attachCheckoutSession(orderId: string, sessionId: string) {
  await db.update(orders).set({ stripeCheckoutSessionId: sessionId }).where(eq(orders.id, orderId));
}

type ReleaseOutcome = "expired" | "canceled" | "payment_failed";

/**
 * Return an unpaid order's reserved stock and close it. One statement: the
 * order update only matches an open, unreleased order, and the stock update
 * only runs for the row it returned, so stock comes back exactly once.
 */
export async function releaseOrder(orderId: string, outcome: ReleaseOutcome) {
  const status = outcome === "expired" ? "expired" : "canceled";
  const payment =
    outcome === "payment_failed" ? sql`'failed'::payment_status` : sql`payment_status`;

  const result = await db.execute(sql`
    WITH released AS (
      UPDATE orders
      SET status = ${status}::order_status, payment_status = ${payment},
          stock_released_at = now(), updated_at = now()
      WHERE id = ${orderId} AND status = 'pending'
        AND payment_status IN ('unpaid', 'processing') AND stock_released_at IS NULL
      RETURNING id
    )
    UPDATE stock SET quantity = stock.quantity + i.quantity, updated_at = now()
    FROM order_items i, released
    WHERE i.order_id = released.id AND stock.id = i.stock_id
  `);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Release orders whose reservation lapsed without the expiry webhook arriving.
 * Returns how many released stock.
 */
export async function releaseOverdueReservations() {
  const overdue = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
        lt(orders.expiresAt, sql`now() - make_interval(mins => ${SWEEP_GRACE_MINUTES})`),
      ),
    )
    .limit(50);
  let released = 0;
  for (const { id } of overdue) if (await releaseOrder(id, "expired")) released++;
  return released;
}

/**
 * Close one of the customer's open orders: expire its Stripe session first,
 * so it can no longer be paid, then release the stock. If the session has
 * already completed, the payment stands and nothing is released. "canceled"
 * means stock was returned; "unchanged" that it had been already.
 */
export async function cancelOpenOrder(order: {
  id: string;
  stripeCheckoutSessionId: string | null;
}) {
  if (order.stripeCheckoutSessionId) {
    try {
      await stripe().checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch {
      const session = await stripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      if (session.status !== "expired") return "completed" as const;
    }
  }
  return (await releaseOrder(order.id, "canceled")) ? ("canceled" as const) : ("unchanged" as const);
}

/** The customer's pending, unpaid orders (an abandoned earlier checkout). */
export function getOpenOrders(userId: string) {
  return db
    .select({ id: orders.id, stripeCheckoutSessionId: orders.stripeCheckoutSessionId })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
      ),
    );
}

/** The order a Checkout Session belongs to, checked against what we sent Stripe. */
async function orderForSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.client_reference_id !== orderId) return null;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id)) {
    return null;
  }
  return order;
}

const paymentIntentId = (session: Stripe.Checkout.Session) =>
  typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);

/**
 * Confirm an order from a verified Stripe event. Only ever called from the
 * webhook, never because the browser reached the success page.
 */
export async function markPaid(session: Stripe.Checkout.Session) {
  const order = await orderForSession(session);
  if (!order) return "unknown_order" as const;

  // We created the session from this order's totals; anything else is wrong.
  if (session.amount_total !== order.totalCents || session.currency !== order.currency) {
    console.error(
      `[checkout] Amount mismatch for order ${order.id}: Stripe ${session.amount_total} ${session.currency}, order ${order.totalCents} ${order.currency}. Not confirming.`,
    );
    return "amount_mismatch" as const;
  }

  const shipping = session.collected_information?.shipping_details ?? null;
  const [confirmed] = await db
    .update(orders)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId(session),
      shipping,
    })
    .where(
      and(eq(orders.id, order.id), eq(orders.status, "pending"), isNull(orders.stockReleasedAt)),
    )
    .returning({ id: orders.id });
  if (confirmed) return "confirmed" as const;

  // Not pending any more. The usual reason is that a concurrent delivery of
  // this event already confirmed it (`order` above may be stale, so decide
  // from the database, not from it). Only if the stock was actually released
  // (an expired session can't normally be paid) record the payment so the
  // order shows up for a refund.
  const [paidAfterRelease] = await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId(session),
    })
    .where(
      and(
        eq(orders.id, order.id),
        isNotNull(orders.stockReleasedAt),
        inArray(orders.paymentStatus, ["unpaid", "processing"]),
      ),
    )
    .returning({ id: orders.id });
  if (!paidAfterRelease) return "already_confirmed" as const;

  console.error(
    `[checkout] Order ${order.id} was paid after its stock was released. Needs a refund or manual fulfilment.`,
  );
  return "paid_after_release" as const;
}

/** A delayed payment method: the session completed but the money hasn't arrived. */
export async function markProcessing(session: Stripe.Checkout.Session) {
  const order = await orderForSession(session);
  if (!order) return "unknown_order" as const;
  await db
    .update(orders)
    .set({ paymentStatus: "processing", stripePaymentIntentId: paymentIntentId(session) })
    .where(
      and(
        eq(orders.id, order.id),
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
      ),
    );
  return "processing" as const;
}

export async function releaseForSession(session: Stripe.Checkout.Session, outcome: ReleaseOutcome) {
  const order = await orderForSession(session);
  if (!order) return "unknown_order" as const;
  return (await releaseOrder(order.id, outcome)) ? ("released" as const) : ("unchanged" as const);
}

// Reads of a customer's own orders live in ./my-orders.ts, which resolves the
// customer from the session itself.
