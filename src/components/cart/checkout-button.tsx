"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/lib/checkout-actions";
import { Spinner } from "../spinner";

/**
 * Posts to the startCheckout Server Action, which reserves stock and
 * redirects to Stripe. While it's pending the button shows progress and a
 * `data-checkout-pending` marker, which the bag page uses (via :has) to
 * freeze the lines so nothing changes while the order is being created.
 */
export function CheckoutButton() {
  return (
    <form action={startCheckout} className="mt-6">
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="btn btn-primary w-full"
      >
        {pending && <Spinner />}
        <span>{pending ? "Going to secure checkout…" : "Checkout"}</span>
      </button>
      {pending && <span hidden data-checkout-pending="" />}
      <p role="status" className="sr-only">
        {pending ? "Reserving your pieces and opening secure checkout." : ""}
      </p>
    </>
  );
}

/**
 * Drops `?checkout=…` from the address once its notice has been shown, so
 * the notice doesn't come back after the next change to the bag or a reload.
 */
export function ConsumeCheckoutNotice() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("checkout")) return;
    url.searchParams.delete("checkout");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  return null;
}
