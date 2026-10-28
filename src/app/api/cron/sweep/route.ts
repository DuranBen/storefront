import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { releaseOverdueReservations } from "@/lib/orders";

/**
 * The overdue-reservation sweep on a schedule, so stock the expiry webhook
 * missed comes back even when nobody checks out. Call it every few minutes
 * with `Authorization: Bearer $CRON_SECRET` (the header Vercel Cron sends).
 * Each order is closed through Stripe first, so running it often is safe.
 */
export async function GET(request: Request) {
  // Never prerendered: it runs on every call.
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    console.error("[cron] CRON_SECRET is not set (or shorter than 32 characters)");
    return new Response("Not configured", { status: 503 });
  }

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const released = await releaseOverdueReservations();
  // Released units are available again: expire the cached catalogue now.
  if (released) revalidateTag("products", { expire: 0 });
  return Response.json({ released });
}
