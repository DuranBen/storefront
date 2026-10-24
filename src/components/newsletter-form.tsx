"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/lib/newsletter";

const initialState: NewsletterState = { status: "idle" };

// Submits via a server action, so the form POSTs and the email never lands
// in the URL, even if it's submitted before the page has hydrated.
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  if (state.status === "subscribed") {
    return (
      <p role="status" className="text-body-lg">
        Thank you. You&rsquo;ll hear from us soon.
      </p>
    );
  }

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          aria-invalid={state.status === "invalid" || undefined}
          aria-describedby={state.status === "invalid" ? "newsletter-error" : undefined}
          className="field border-white/30 bg-transparent text-paper placeholder:text-white/50 focus:border-paper"
        />
        <button type="submit" disabled={pending} className="btn btn-inverse shrink-0">
          Subscribe
        </button>
      </form>
      {state.status === "invalid" && (
        <p id="newsletter-error" role="alert" className="mt-2 text-body-sm">
          {state.message}
        </p>
      )}
    </div>
  );
}
