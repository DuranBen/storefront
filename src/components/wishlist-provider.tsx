"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getWishlistSlugs } from "@/lib/wishlist-actions";

type Wishlist = {
  /** Saved slugs; empty until loaded, and while signed out. */
  saved: ReadonlySet<string>;
  /** Show a change straight away, before the server confirms it. */
  setSaved: (slug: string, saved: boolean) => void;
  /** Re-read from the server (after an action, or a change elsewhere). */
  reload: () => void;
};

const WishlistContext = createContext<Wishlist | null>(null);

/**
 * Which products the signed-in customer has saved, for the hearts on product
 * cards. Product pages are cached and shared by everyone, so the saved state
 * is loaded here, on the client, rather than rendered into them. It reloads
 * when the window regains focus (e.g. after signing in or out elsewhere).
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [saved, setSavedSlugs] = useState<ReadonlySet<string>>(new Set());

  const reload = useCallback(() => {
    getWishlistSlugs()
      .then((slugs) => setSavedSlugs(new Set(slugs ?? [])))
      .catch(() => {}); // offline: keep what's shown
  }, []);

  const setSaved = useCallback((slug: string, isSaved: boolean) => {
    setSavedSlugs((current) => {
      const next = new Set(current);
      if (isSaved) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);

  return (
    <WishlistContext.Provider value={{ saved, setSaved, reload }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return wishlist;
}
