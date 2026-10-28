"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setWishlisted } from "@/lib/wishlist-actions";
import { HeartIcon } from "./icons";
import { useWishlist } from "./wishlist-provider";

/**
 * Whether a product is saved, and a toggle that saves it to the signed-in
 * customer's wishlist. Shows the change straight away; signed out, it goes
 * to sign-in instead. Shared by the card heart and the product page button.
 */
export function useWishlistToggle(productSlug: string) {
  const router = useRouter();
  const { saved, setSaved, reload } = useWishlist();
  const [pending, startTransition] = useTransition();
  const isSaved = saved.has(productSlug);

  const toggle = () => {
    const next = !isSaved;
    setSaved(productSlug, next);
    startTransition(async () => {
      const result = await setWishlisted(productSlug, next).catch(() => null);
      if (result?.status === "signed_out") {
        setSaved(productSlug, false);
        router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      // Failed or refused: show what the server actually has.
      if (result?.status !== (next ? "saved" : "removed")) reload();
    });
  };

  return { isSaved, pending, toggle };
}

/** The heart on a product card. */
export function WishlistButton({ productSlug, productName }: { productSlug: string; productName: string }) {
  const { isSaved, pending, toggle } = useWishlistToggle(productSlug);

  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={`${isSaved ? "Remove" : "Add"} ${productName} ${isSaved ? "from" : "to"} wishlist`}
      aria-busy={pending || undefined}
      onClick={toggle}
      className="btn-icon text-ink"
    >
      <HeartIcon fill={isSaved ? "currentColor" : "none"} />
    </button>
  );
}
