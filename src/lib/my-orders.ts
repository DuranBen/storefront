// The signed-in customer's own orders. Every function resolves the customer
// from the session itself and filters by their id, so no caller can pass in
// someone else's: an order that isn't theirs is simply not found. (The data
// access layer pattern from the Next.js authentication guide.)
//
// getMy… are for pages: they redirect to sign-in when signed out.
// findMy… are for actions and route handlers: they return undefined instead.

import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser, requireUser } from "./session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orderWithItems(userId: string, where: { id: string } | { sessionId: string }) {
  return db.query.orders.findFirst({
    where: and(
      eq(orders.userId, userId),
      "id" in where ? eq(orders.id, where.id) : eq(orders.stripeCheckoutSessionId, where.sessionId),
    ),
    with: { items: { orderBy: (item, { asc }) => [asc(item.id)] } },
  });
}

/**
 * Order history: orders that reached payment (paid, processing or failed),
 * newest first. Checkouts that were abandoned or are still on Stripe's page
 * never took a payment, so they're left out.
 */
export async function getMyOrders(limit = 50) {
  const user = await requireUser("/account/orders");
  return db.query.orders.findMany({
    where: and(
      eq(orders.userId, user.id),
      inArray(orders.paymentStatus, ["paid", "processing", "failed"]),
    ),
    with: { items: { orderBy: (item, { asc }) => [asc(item.id)] } },
    orderBy: (order, { desc }) => [desc(order.createdAt)],
    limit,
  });
}

/** One order with its lines, by id (from a URL, so the id is validated first). */
export async function getMyOrder(orderId: string) {
  const user = await requireUser(`/account/orders/${encodeURIComponent(orderId)}`);
  if (!UUID.test(orderId)) return undefined;
  return orderWithItems(user.id, { id: orderId });
}

/** One order with its lines, by the Checkout Session Stripe returned the shopper with. */
export async function getMyOrderBySession(sessionId: string) {
  const user = await requireUser(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`);
  if (!sessionId) return undefined;
  return orderWithItems(user.id, { sessionId });
}

/** By id, without redirecting: undefined when signed out or not theirs. */
export async function findMyOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !UUID.test(orderId)) return undefined;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);
  return order;
}

/** By Checkout Session id, without redirecting: undefined when signed out or not theirs. */
export async function findMyOrderBySession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user || !sessionId) return undefined;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.stripeCheckoutSessionId, sessionId), eq(orders.userId, user.id)))
    .limit(1);
  return order;
}
