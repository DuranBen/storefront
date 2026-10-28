import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";

// Draft copy: review before launch.

export const metadata: Metadata = {
  title: "Our story",
  description: "Atelier makes ready-to-wear, leather goods, shoes and jewellery to be worn for years.",
};

export default function AboutPage() {
  return (
    <>
      <ContentHeader
        eyebrow="The house"
        title="Our story"
        intro="Atelier began with a simple idea: make fewer things, and make them well enough to keep."
      />
      <ContentSection title="Made to be lived in">
        <p>
          We design ready-to-wear, leather goods, shoes and jewellery for the way people actually
          dress: pieces that work hard on an ordinary Tuesday and still feel special years later.
        </p>
        <p>
          Every collection starts with materials: weathered wools, full-grain leathers, silks and
          precious metals, chosen because they age well.
        </p>
      </ContentSection>
      <ContentSection title="Small runs, on purpose">
        <p>
          We produce in limited quantities and restock thoughtfully, so pieces sell through rather
          than pile up. When something sells out, it may not return in the same form.
        </p>
      </ContentSection>
      <ContentSection title="Find out more">
        <p>
          Read about <Link href="/about/craft">how our pieces are made</Link> and{" "}
          <Link href="/about/sustainability">our approach to sustainability</Link>.
        </p>
      </ContentSection>
    </>
  );
}
