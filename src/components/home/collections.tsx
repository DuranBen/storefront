import Image from "next/image";
import Link from "next/link";
import { collections, unsplash } from "@/lib/catalog";
import { SectionHeading } from "./section-heading";

export function FeaturedCollections() {
  return (
    <section className="section container-page">
      <SectionHeading eyebrow="Explore" title="Shop by category" />
      <ul className="grid grid-cols-2 gap-x-0.5 gap-y-8 md:grid-cols-4">
        {collections.map((collection) => (
          <li key={collection.slug} className="group relative">
            <div className="relative aspect-portrait overflow-hidden bg-canvas">
              <Image
                src={unsplash(collection.image.id, 1400)}
                alt={collection.image.alt}
                fill
                sizes="(min-width: 48rem) 25vw, 50vw"
                style={{ objectPosition: collection.image.position }}
                className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-4 px-2 md:px-0">
              <h3 className="label-caps">
                <Link
                  href={`/collections/${collection.slug}`}
                  className="after:absolute after:inset-0"
                >
                  {collection.title}
                </Link>
              </h3>
              <p className="mt-1 text-body-sm text-muted underline-offset-4 group-hover:underline">
                Shop now
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
