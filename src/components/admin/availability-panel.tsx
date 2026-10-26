"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addSize, type AddSizeState } from "@/lib/admin-actions";
import { StockRowForm } from "./stock-row-form";

type StockRow = { id: number; size: string | null; quantity: number; reserved: number };

/**
 * A product's availability: units available to sell per size (0 = sold out),
 * with units reserved by checkouts in progress shown alongside.
 */
export function AvailabilityPanel({ productId, rows }: { productId: number; rows: StockRow[] }) {
  const sized = rows.some((row) => row.size !== null);
  return (
    <section aria-labelledby="availability" className="mt-14">
      <h3 id="availability" className="label-caps w-full hairline-b pb-3">
        Availability
      </h3>
      <p className="mt-3 text-body-sm text-muted">
        Units available to sell{sized ? " per size" : ""}. Set a size to 0 to show it as sold out.
        Units reserved by checkouts in progress are already subtracted, and return automatically if
        those checkouts aren&rsquo;t paid.
      </p>
      <ul className="mt-4">
        {rows.map((row) => (
          <StockRowForm
            key={row.id}
            stockId={row.id}
            quantity={row.quantity}
            reserved={row.reserved}
            label={row.size ? `Size ${row.size}` : "One size"}
          />
        ))}
      </ul>
      {sized && <AddSizeForm productId={productId} />}
    </section>
  );
}

function AddSizeForm({ productId }: { productId: number }) {
  const [state, formAction] = useActionState<AddSizeState, FormData>(addSize, { status: "idle" });
  const inputId = `new-size-${productId}`;
  return (
    <form action={formAction} noValidate className="mt-6 flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div>
        <label htmlFor={inputId} className="label-caps text-muted">
          Add a size
        </label>
        <input id={inputId} name="size" type="text" maxLength={10} className="field mt-2 w-32 py-2" />
      </div>
      <AddButton />
      {state.status !== "idle" && (
        <p
          role={state.status === "saved" ? "status" : "alert"}
          className={`w-full text-body-sm ${state.status === "saved" ? "text-muted" : "text-sale"}`}
        >
          {state.status === "saved" ? `Size ${state.size} added with 0 available.` : state.message}
        </p>
      )}
    </form>
  );
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">
      {pending ? "Adding…" : "Add size"}
    </button>
  );
}
