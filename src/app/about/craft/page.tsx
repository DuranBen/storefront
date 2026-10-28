import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";

// Draft copy: review before launch.

export const metadata: Metadata = {
  title: "Craftsmanship",
  description: "How Atelier pieces are cut, stitched and finished.",
};

export default function CraftPage() {
  return (
    <>
      <ContentHeader
        eyebrow="The house"
        title="Craftsmanship"
        intro="Our pieces are made with workshops we know well, by people who have spent years perfecting a single craft."
      />
      <ContentSection title="Tailoring and ready-to-wear">
        <p>
          Coats and jackets are cut generously and finished by hand where it matters: collars,
          buttonholes and hems. Knitwear is made from yarns chosen for softness and strength.
        </p>
      </ContentSection>
      <ContentSection title="Leather goods">
        <p>
          Our bags use full-grain leather, which keeps the natural surface of the hide. It is the
          strongest part of the leather, and it softens and develops character as it&rsquo;s carried.
        </p>
      </ContentSection>
      <ContentSection title="Shoes">
        <p>
          Shoes are lasted by hand in suede, leather and printed satin, and built to be resoled
          rather than replaced.
        </p>
      </ContentSection>
      <ContentSection title="Jewellery">
        <p>
          Pieces are set and polished by hand in sterling silver and gold, with pearls and stones
          selected one by one.
        </p>
      </ContentSection>
      <ContentSection title="Looking after them">
        <p>
          Good materials last longest with a little care. Our <Link href="/client-services/care">care
          guide</Link> explains how.
        </p>
      </ContentSection>
    </>
  );
}
