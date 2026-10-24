"use client";

import Image from "next/image";
import { useState } from "react";
import { imageSrc, type Img } from "@/lib/catalog";

/**
 * Swipeable full-width gallery on small screens; on large screens the
 * images stack (first one full width, the rest two-up) beside the sticky
 * product info.
 */
export function ProductGallery({ images }: { images: Img[] }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="relative">
      <ul
        aria-label="Product images"
        onScroll={(e) => {
          const el = e.currentTarget;
          setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain lg:grid lg:grid-cols-2 lg:gap-0.5 lg:overflow-visible"
      >
        {images.map((image, i) => (
          <li key={i} className="w-full shrink-0 snap-start lg:first:col-span-2">
            <div className="media-product">
              <Image
                src={imageSrc(image, 1800)}
                alt={image.alt}
                fill
                sizes={i === 0 ? "(min-width: 64rem) 58vw, 100vw" : "(min-width: 64rem) 29vw, 100vw"}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                style={{ objectPosition: image.position }}
              />
            </div>
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <p
          aria-hidden="true"
          className="absolute right-gutter bottom-4 bg-paper px-2 py-1 text-caption tabular-nums lg:hidden"
        >
          {current + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
