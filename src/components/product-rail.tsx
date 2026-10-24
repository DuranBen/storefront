"use client";

import { useRef, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

/** Horizontal, swipeable rail with previous / next buttons for pointer users. */
export function ProductRail({ label, children }: { label: string; children: ReactNode }) {
  const railRef = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div>
      <ul ref={railRef} aria-label={label} className="rail">
        {children}
      </ul>
      <div className="mt-6 hidden justify-end gap-1 md:flex">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous products"
          className="btn-icon border border-line-strong"
        >
          <ArrowLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next products"
          className="btn-icon border border-line-strong"
        >
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
