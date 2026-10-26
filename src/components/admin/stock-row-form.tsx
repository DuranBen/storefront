"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { setStock, type StockFormState } from "@/lib/admin-actions";
import { stockState } from "@/lib/catalog";
import { StockStatus } from "../product/stock-status";

/**
 * One stock row: the units available to sell (editable) and, read-only, the
 * units reserved by checkouts in progress. Saves through setStock, which only
 * applies if the quantity still matches what this row last saw (`expected`),
 * so it can't overwrite a reservation or release that happened meanwhile.
 * Shared by the product edit page and /admin/stock.
 */
export function StockRowForm({
  stockId,
  quantity,
  label,
  reserved,
  note,
}: {
  stockId: number;
  quantity: number;
  /** e.g. "Size M" or "One size". */
  label: string;
  /** Units held by pending checkouts (already subtracted from `quantity`). */
  reserved?: number;
  /** Shown under the row, e.g. when it no longer matches a filter. */
  note?: string;
}) {
  const [state, formAction] = useActionState<StockFormState, FormData>(setStock, {
    status: "idle",
  });
  // What the database held when last seen: whichever came last of a server
  // render (page load, or a refresh after any save on the page) and this
  // row's own save or conflict. A newer server value replaces an older save
  // result, so the row never shows a number the page has since moved past.
  const [expected, setExpected] = useState(quantity);
  const [showMessage, setShowMessage] = useState(false);
  const [seenState, setSeenState] = useState(state);
  const [seenQuantity, setSeenQuantity] = useState(quantity);
  if (state !== seenState) {
    setSeenState(state);
    setShowMessage(state.status !== "idle");
    if (state.status === "saved") setExpected(state.quantity);
    else if (state.status === "conflict") setExpected(state.current);
  } else if (quantity !== seenQuantity) {
    setSeenQuantity(quantity);
    if (quantity !== expected) {
      // Changed elsewhere (e.g. a checkout): the last message is out of date.
      setExpected(quantity);
      setShowMessage(false);
    }
  }
  const inputId = `stock-${stockId}`;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 hairline-b py-4 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
      <label htmlFor={inputId} className="font-medium">
        {label}
        <span className="sr-only">, units available</span>
      </label>
      <div className="order-3 col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm sm:order-none sm:col-span-1">
        <StockStatus state={stockState(expected)} />
        {reserved !== undefined && reserved > 0 && (
          <span className="text-muted">{reserved} reserved in checkout</span>
        )}
      </div>
      <form action={formAction} noValidate className="flex items-center gap-2">
        <input type="hidden" name="stockId" value={stockId} />
        <input type="hidden" name="expected" value={expected} />
        <span aria-hidden="true" className="label-caps hidden text-muted md:inline">
          Available
        </span>
        <input
          // Remount with the stored value after a save or a conflict.
          key={expected}
          id={inputId}
          name="quantity"
          type="text"
          inputMode="numeric"
          defaultValue={expected}
          aria-describedby={showMessage ? `${inputId}-message` : undefined}
          className="field w-24 py-2 text-right"
        />
        <SaveButton />
      </form>
      {showMessage && state.status !== "idle" && (
        <p
          id={`${inputId}-message`}
          role={state.status === "saved" ? "status" : "alert"}
          className={`order-4 col-span-full text-body-sm ${state.status === "saved" ? "text-muted" : "text-sale"}`}
        >
          {state.status === "saved"
            ? `Saved: ${state.quantity} available.`
            : state.status === "conflict"
              ? `This changed to ${state.current} since you loaded the page (a checkout may have reserved or released units). Check the number and save again.`
              : state.message}
        </p>
      )}
      {note && <p className="order-5 col-span-full text-body-sm text-muted">{note}</p>}
    </li>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    // Not `disabled` while saving: disabling the focused button would drop
    // keyboard focus to the page. A click during a save is ignored instead.
    <button
      type="submit"
      aria-disabled={pending}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      className="btn btn-secondary btn-sm aria-disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
