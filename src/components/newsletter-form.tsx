"use client";

import { useState } from "react";

// Front-end only for now: validates and confirms, nothing is sent.
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p role="status" className="text-body-lg">
        Thank you. You&rsquo;ll hear from us soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
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
        className="field border-white/30 bg-transparent text-paper placeholder:text-white/50 focus:border-paper"
      />
      <button type="submit" className="btn btn-inverse shrink-0">
        Subscribe
      </button>
    </form>
  );
}
