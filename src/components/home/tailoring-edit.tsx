import Image from "next/image";
import Link from "next/link";
import { tailoringEdit, unsplash } from "@/lib/catalog";

/** Two-up editorial imagery with a centred story block beneath. */
export function TailoringEdit() {
  return (
    <section className="pb-section">
      <div className="grid-split">
        {tailoringEdit.images.map((image) => (
          <div key={image.id} className="relative aspect-portrait overflow-hidden bg-canvas">
            <Image
              src={unsplash(image.id, 1600)}
              alt={image.alt}
              fill
              sizes="(min-width: 48rem) 50vw, 100vw"
              style={{ objectPosition: image.position }}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="container-text mt-12 text-center md:mt-16">
        <p className="eyebrow text-muted">{tailoringEdit.eyebrow}</p>
        <h2 className="display-sm mt-3">{tailoringEdit.title}</h2>
        <p className="mt-5 text-body-lg text-muted">{tailoringEdit.body}</p>
        <Link href="/collections/tailoring" className="btn btn-secondary mt-8">
          Discover the edit
        </Link>
      </div>
    </section>
  );
}
