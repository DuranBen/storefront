import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/db";
import { stripeEvents } from "@/db/schema";
import { markPaid, markProcessing, releaseForSession } from "@/lib/orders";
import { stripe, webhookSecret } from "@/lib/stripe";

/** The events checkout depends on; subscribe the endpoint to exactly these. */
const HANDLED_EVENTS = new Set<Stripe.Event["type"]>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

/**
 * Stripe webhook: the only place an order becomes paid. Every request is
 * signature-checked against the raw body before anything is read from it.
 * Events are recorded by id, so a redelivered event is skipped once it has
 * been processed; the order updates themselves are idempotent too, so a
 * retry after a failure part-way through, or the same event delivered
 * concurrently, is safe.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret());
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Acknowledge anything else without recording or acting on it.
  if (!HANDLED_EVENTS.has(event.type)) return Response.json({ received: true, outcome: "ignored" });

  const [inserted] = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });
  if (!inserted) {
    const [seen] = await db
      .select({ processedAt: stripeEvents.processedAt })
      .from(stripeEvents)
      .where(eq(stripeEvents.id, event.id));
    if (seen?.processedAt) return Response.json({ received: true, duplicate: true });
  }

  try {
    const outcome = await handle(event);
    // Released units are available again. Expire the cached catalogue now
    // (not stale-while-revalidate) so the next product page shows them.
    if (outcome === "released") revalidateTag("products", { expire: 0 });
    await db
      .update(stripeEvents)
      .set({ processedAt: new Date() })
      .where(eq(stripeEvents.id, event.id));
    return Response.json({ received: true, outcome });
  } catch (error) {
    console.error(`[stripe] Failed to process ${event.type} ${event.id}`, error);
    // A 5xx makes Stripe retry; processing is idempotent.
    return new Response("Processing failed", { status: 500 });
  }
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Delayed payment methods complete while still unpaid: hold the order.
      return session.payment_status === "unpaid" ? markProcessing(session) : markPaid(session);
    }
    case "checkout.session.async_payment_succeeded":
      return markPaid(event.data.object);
    case "checkout.session.async_payment_failed":
      return releaseForSession(event.data.object, "payment_failed");
    case "checkout.session.expired":
      return releaseForSession(event.data.object, "expired");
    default:
      return "ignored"; // unreachable: filtered by HANDLED_EVENTS
  }
}
