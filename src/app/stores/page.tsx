import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentPage, ContentSection } from "@/components/content-page";
import { stores } from "@/lib/catalog";

// Draft copy: review before launch. The stores themselves come from
// `stores` in src/lib/catalog.ts (placeholders until replaced).

export const metadata: Metadata = {
  title: "Find a store",
  description: "Visit an Atelier store for styling, alterations and collections in person.",
};

export default function StoresPage() {
  return (
    <ContentPage>
      <ContentHeader
        eyebrow="Stores"
        title="Find a store"
        intro="See the collections in person, try on sizes and get styling advice from our client advisors."
      />
      <ul className="mt-12 hairline-t">
        {stores.map((store) => (
          <li key={store.city} className="grid gap-2 hairline-b py-6 sm:grid-cols-2 sm:gap-6">
            <div>
              <h2 className="heading">{store.city}</h2>
              <p className="mt-1 text-body-sm text-muted">{store.area}</p>
            </div>
            <ul className="text-body-sm text-muted">
              {store.hours.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <ContentSection title="Private appointments">
        <p>
          Book time with a client advisor, in store or by video.{" "}
          <Link href="/appointments">Book an appointment</Link>
        </p>
      </ContentSection>
    </ContentPage>
  );
}
