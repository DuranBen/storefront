"use client";

import { useState } from "react";
import { HeartIcon } from "./icons";

// Local-only toggle until wishlists are persisted.
export function WishlistButton({ productName }: { productName: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Add"} ${productName} ${saved ? "from" : "to"} wishlist`}
      onClick={() => setSaved((s) => !s)}
      className="btn-icon text-ink"
    >
      <HeartIcon fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
