import Image from "next/image";
import Link from "next/link";
import { eveningBanner, unsplash } from "@/lib/catalog";

/** Full-bleed campaign image with centred copy. */
export function EveningBanner() {
  return (
    <section className="media-hero text-white lg:h-[90svh]">
      <Image
        src={unsplash(eveningBanner.image.id)}
        alt={eveningBanner.image.alt}
        fill
        sizes="100vw"
        style={{ objectPosition: eveningBanner.image.position }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center p-gutter text-center">
        <div>
          <p className="eyebrow">{eveningBanner.eyebrow}</p>
          <h2 className="display mt-3">{eveningBanner.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-body-lg text-white/85">{eveningBanner.body}</p>
          <Link href="/collections/evening" className="btn btn-inverse mt-8">
            Shop eveningwear
          </Link>
        </div>
      </div>
    </section>
  );
}
