"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { syncCartCount } from "@/lib/cart-cookie";
import { settleBag } from "@/lib/checkout-actions";

/**
 * Takes a paid checkout's pieces out of the bag (the server checks the
 * order). On the confirmation page, and on the bag for shoppers who never
 * reached it; `refresh` re-renders a page that shows the bag.
 */
export function SettleBag({ refresh = false }: { refresh?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    settleBag().then((count) => {
      if (count === undefined) return;
      syncCartCount(count);
      if (refresh) router.refresh();
    });
  }, [router, refresh]);
  return null;
}

/**
 * While the webhook hasn't confirmed the payment yet, re-render the page
 * every couple of seconds. It only reads the order; it never marks it paid.
 */
export function RefreshUntilConfirmed({ timeoutSeconds = 40 }: { timeoutSeconds?: number }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  // Bumped by "Check again" to start another round of refreshing.
  const [round, setRound] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > timeoutSeconds * 1000) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, 2000);
    return () => clearInterval(timer);
  }, [router, timeoutSeconds, round]);

  if (!timedOut) return null;
  return (
    <div className="mt-6">
      <p className="text-body-sm text-muted">
        This is taking longer than usual. Your pieces stay reserved while we wait for the payment to
        be confirmed.
      </p>
      <button
        type="button"
        onClick={() => {
          setTimedOut(false);
          setRound((n) => n + 1);
          router.refresh();
        }}
        className="btn btn-secondary btn-sm mt-4"
      >
        Check again
      </button>
    </div>
  );
}
