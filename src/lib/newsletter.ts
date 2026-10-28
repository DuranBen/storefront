"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export type NewsletterState =
  | { status: "idle" }
  | { status: "subscribed" }
  | { status: "invalid"; message: string };

/**
 * Newsletter sign-up. Posting through a server action keeps the address out
 * of the URL, including when the form is submitted before hydration.
 * Stored lowercased; signing up twice is the same as once, and the reply is
 * the same either way, so it doesn't reveal who is already subscribed.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "invalid", message: "Please enter a valid email address." };
  }
  await db
    .insert(newsletterSubscribers)
    .values({ email: email.toLowerCase() })
    .onConflictDoNothing();
  return { status: "subscribed" };
}
