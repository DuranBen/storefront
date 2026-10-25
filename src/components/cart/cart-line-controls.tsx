"use client";

import { useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { removeFromCart, updateCartQuantity } from "@/lib/cart-actions";
import { syncCartCount } from "@/lib/cart-cookie";
import { MinusIcon, PlusIcon } from "../icons";

// Controls post straight to Server Actions, so they also work before
// hydration. While one is pending it sets aria-busy, which the bag page
// uses (via :has) to dim the line and the subtotal until the update lands.

/**
 * − quantity + stepper. Each button submits the quantity it would set, so
 * the server validates the target value (and caps it at stock).
 */
export function QuantityStepper({
  stockId,
  quantity,
  max,
  label,
}: {
  stockId: number;
  quantity: number;
  max: number;
  label: string;
}) {
  return (
    <form action={updateCartQuantity}>
      <input type="hidden" name="stockId" value={stockId} />
      <Stepper quantity={quantity} max={max} label={label} />
    </form>
  );
}

function Stepper({ quantity, max, label }: { quantity: number; max: number; label: string }) {
  const { pending, data } = useFormStatus();
  // Show the requested quantity straight away; the server's answer replaces it.
  const shown = pending ? Number(data?.get("quantity") ?? quantity) : quantity;

  return (
    <div
      role="group"
      aria-label={`Quantity of ${label}`}
      aria-busy={pending || undefined}
      className="flex h-11 w-fit items-center border border-line"
    >
      <StepButton
        value={quantity - 1}
        disabled={pending || quantity <= 1}
        label={`Decrease quantity of ${label}`}
      >
        <MinusIcon width={16} height={16} />
      </StepButton>
      <span className="min-w-8 text-center tabular-nums" aria-live="polite">
        {shown}
      </span>
      <StepButton
        value={quantity + 1}
        disabled={pending || quantity >= max}
        label={`Increase quantity of ${label}`}
      >
        <PlusIcon width={16} height={16} />
      </StepButton>
    </div>
  );
}

function StepButton({
  value,
  disabled,
  label,
  children,
}: {
  value: number;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      name="quantity"
      value={value}
      disabled={disabled}
      aria-label={label}
      className="btn-icon h-full w-11 disabled:cursor-not-allowed disabled:text-subtle disabled:hover:opacity-100"
    >
      {children}
    </button>
  );
}

export function RemoveForm({ stockId, label }: { stockId: number; label: string }) {
  return (
    <form action={removeFromCart}>
      <input type="hidden" name="stockId" value={stockId} />
      <RemoveButton label={label} />
    </form>
  );
}

function RemoveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="label-caps link cursor-pointer text-muted hover:text-ink disabled:cursor-not-allowed"
    >
      {pending ? "Removing…" : "Remove"}
      <span className="sr-only"> {label}</span>
    </button>
  );
}

/** Keeps the header badge in step with the bag's item count on every render. */
export function CartChangeNotifier({ count }: { count: number }) {
  useEffect(() => syncCartCount(count), [count]);
  return null;
}
