// Orders and their stock reservations. Every state change here is a single
// conditional statement (or one db.batch transaction), so it's safe to run
// twice: duplicate webhooks, retries and races leave the data unchanged.

import "server-only";
import { and, eq, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders, stock } from "@/db/schema";
import type { Cart } from "./cart";
import { violatedConstraint } from "./db-errors";
import type { SessionUser } from "./session";
import { stripe } from "./stripe";

/** How long stock stays reserved for an unpaid order. Stripe's session expires first. */
const RESERVATION_MINUTES = 35;
/** Grace after expires_at before the sweep releases an order the webhook missed. */
const SWEEP_GRACE_MINUTES = 5;

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
    const constraint = violatedConstraint(error);
    if (constraint === "stock_quantity_check") {
      return { ok: false as const, reason: "sold_out" as const };
    }
    // Another checkout for this customer is open (e.g. started in another tab).
    if (constraint === "orders_one_open_checkout_per_user_idx") {
      return { ok: false as const, reason: "in_progress" as const };
    }
    throw error;
  }

  return { ok: true as const, order: { id, expiresAt, totalCents } };
}

/**
 * Record the order's Checkout Session, only while the order is still open.
 * False means a concurrent checkout closed it first: the session must not be
 * handed out.
 */
export async function attachCheckoutSession(orderId: string, sessionId: string) {
  const attached = await db
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
        isNull(orders.stockReleasedAt),
      ),
    )
    .returning({ id: orders.id });
  return attached.length > 0;
}

type ReleaseOutcome = "expired" | "canceled" | "payment_failed";

/**
 * Return an unpaid order's reserved stock and close it. One statement: the
 * order update only matches an open, unreleased order, and the stock update
 * only runs for the row it returned, so stock comes back exactly once.
 *
 * With `sessionId`, it only releases if the order's session is still that one
 * (null: none attached yet), so a session attached since it was read is never
 * left payable for released stock.
 */
export async function releaseOrder(
  orderId: string,
  outcome: ReleaseOutcome,
  options?: { sessionId: string | null },
) {
  const status = outcome === "expired" ? "expired" : "canceled";
  const payment =
    outcome === "payment_failed" ? sql`'failed'::payment_status` : sql`payment_status`;
  const sameSession = options
    ? sql`AND stripe_checkout_session_id IS NOT DISTINCT FROM ${options.sessionId}::text`
    : sql``;

  const result = await db.execute(sql`
    WITH released AS (
      UPDATE orders
      SET status = ${status}::order_status, payment_status = ${payment},
          stock_released_at = now(), updated_at = now()
      WHERE id = ${orderId} AND status = 'pending'
        AND payment_status IN ('unpaid', 'processing') AND stock_released_at IS NULL
        ${sameSession}
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
 * Each is closed through Stripe first (closeOpenOrder), so an order that was
 * paid while its webhook is delayed keeps its stock. Returns how many
 * released stock.
 */
export async function releaseOverdueReservations() {
  const overdue = await db
    .select({ id: orders.id, stripeCheckoutSessionId: orders.stripeCheckoutSessionId })
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
  for (const order of overdue) {
    try {
      if ((await closeOpenOrder(order, "expired")) === "released") released++;
    } catch (error) {
      // Stripe unreachable: leave it for the webhook or the next sweep.
      console.error(`[checkout] Couldn't sweep order ${order.id}`, error);
    }
  }
  return released;
}

/**
 * Close an open order: expire its Stripe session first, so it can no longer
 * be paid, then release the stock. If the session has already completed,
 * the payment stands and nothing is released ("completed"). "released" means
 * stock was returned; "unchanged" that it had been already. Throws if Stripe
 * can't be reached or the session couldn't be expired.
 */
export async function closeOpenOrder(
  order: { id: string; stripeCheckoutSessionId: string | null },
  outcome: "canceled" | "expired" = "canceled",
) {
  if (order.stripeCheckoutSessionId) {
    try {
      await stripe().checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch (error) {
      // Expiring fails for a session that's no longer open: find out why.
      const session = await stripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      if (session.status === "complete") return "completed" as const;
      if (session.status !== "expired") throw error;
    }
  }
  // Only if no session was attached since `order` was read (a checkout still
  // being created in another tab has none yet; once attached, it's payable).
  const released = await releaseOrder(order.id, outcome, {
    sessionId: order.stripeCheckoutSessionId,
  });
  return released ? ("released" as const) : ("unchanged" as const);
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
    // Money was taken, so record it, but don't confirm. A paid order is never
    // released or swept, so it keeps its stock, and the customer is told
    // their payment was received and needs follow-up rather than "no payment".
    await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: new Date(), stripePaymentIntentId: paymentIntentId(session) })
      .where(and(eq(orders.id, order.id), inArray(orders.paymentStatus, ["unpaid", "processing"])));
    console.error(
      `[checkout] Amount mismatch for order ${order.id}: Stripe ${session.amount_total} ${session.currency}, order ${order.totalCents} ${order.currency}. Recorded as paid, not confirmed. Needs a refund or manual fulfilment.`,
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

const intentId = (intent: string | Stripe.PaymentIntent | null) =>
  typeof intent === "string" ? intent : (intent?.id ?? null);

/**
 * A refund (made in the Stripe Dashboard) on an order's payment. The charge
 * carries the total refunded so far, so this sets that total rather than
 * adding to it, and never lowers it: redelivered or out-of-order events are
 * harmless. Capped at the order total (an amount-mismatch charge can exceed it).
 */
export async function recordRefund(charge: Stripe.Charge) {
  const intent = intentId(charge.payment_intent);
  if (!intent) return "unknown_order" as const;
  const [order] = await db
    .update(orders)
    .set({
      amountRefundedCents: sql`greatest(${orders.amountRefundedCents}, least(${charge.amount_refunded}, ${orders.totalCents}))`,
    })
    .where(eq(orders.stripePaymentIntentId, intent))
    .returning({ id: orders.id });
  return order ? ("refund_recorded" as const) : ("unknown_order" as const);
}

/**
 * A dispute (chargeback) on an order's payment: keep Stripe's latest status.
 * `eventCreated` orders the events, so an older one arriving late is ignored.
 */
export async function recordDispute(dispute: Stripe.Dispute, eventCreated: number) {
  const intent = intentId(dispute.payment_intent);
  if (!intent) return "unknown_order" as const;
  const at = new Date(eventCreated * 1000);
  const [order] = await db
    .update(orders)
    .set({ disputeStatus: dispute.status, disputeUpdatedAt: at })
    .where(
      and(
        eq(orders.stripePaymentIntentId, intent),
        or(isNull(orders.disputeUpdatedAt), lte(orders.disputeUpdatedAt, at)),
      ),
    )
    .returning({ id: orders.id });
  return order ? ("dispute_recorded" as const) : ("unchanged" as const);
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
