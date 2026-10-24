"use server";

export type NewsletterState =
  | { status: "idle" }
  | { status: "subscribed" }
  | { status: "invalid"; message: string };

/**
 * Newsletter sign-up. Posting through a server action keeps the address out
 * of the URL, including when the form is submitted before hydration.
 * Nothing is stored yet: validate and confirm only.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "invalid", message: "Please enter a valid email address." };
  }
  return { status: "subscribed" };
}
