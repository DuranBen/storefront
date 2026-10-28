// Server-only Stripe client. Created on first use so the app still builds
// and renders without keys; anything that needs Stripe fails loudly instead.
// Use a restricted key (rk_…) with only the permissions checkout needs.

import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { apiVersion: "2026-09-30.endive" });
  }
  return client;
}

/** Whether checkout runs in live mode, going by the key (sk_live_… / rk_live_…). */
export function isLiveMode() {
  return /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
}

export function webhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return secret;
}

/** Absolute URL on this site, for Stripe's success and cancel redirects. */
export function siteUrl(path: string) {
  const base = process.env.BETTER_AUTH_URL;
  if (!base) throw new Error("BETTER_AUTH_URL is not set");
  return new URL(path, base).toString();
}
