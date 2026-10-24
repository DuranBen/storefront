import Image from "next/image";
import Link from "next/link";
import { hero, unsplash } from "@/lib/catalog";

export function Hero() {
  return (
    // Pulled up under the sticky header, which turns transparent over it.
    <section data-header-overlay className="media-hero -mt-header text-white">
      <Image
        src={unsplash(hero.image.id)}
        alt={hero.image.alt}
        fill
        preload
        sizes="100vw"
        style={{ objectPosition: hero.image.position }}
      />
      {/* Scrims keep the header and headline legible over bright areas. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 pb-10 md:pb-16">
        <div className="container-page">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="display mt-3 max-w-3xl">{hero.title}</h1>
          <p className="mt-4 max-w-md text-body-lg text-white/85">{hero.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/collections/autumn-winter-2026" className="btn btn-inverse">
              Discover the collection
            </Link>
            <Link href="/collections/women" className="btn btn-secondary-inverse">
              Shop women
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
