import type { StockState } from "@/lib/catalog";

const dotColour = {
  in_stock: "bg-success",
  low_stock: "bg-sale",
  out_of_stock: "bg-subtle",
} as const;

export function StockStatus({ state, size }: { state: StockState; size?: string }) {
  const suffix = size ? ` in size ${size}` : "";
  const label =
    state.status === "in_stock"
      ? `In stock${suffix}`
      : state.status === "low_stock"
        ? `Only ${state.units} left${suffix}`
        : `Sold out${suffix}`;

  return (
    <p className="flex items-center gap-2 text-body-sm">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotColour[state.status]}`} />
      {label}
    </p>
  );
}
