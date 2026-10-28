import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";

// Draft copy: review before launch. Always defer to each piece's care label.

export const metadata: Metadata = {
  title: "Care guide",
  description: "How to look after wool, leather, suede, silk and jewellery.",
};

export default function CarePage() {
  return (
    <>
      <ContentHeader
        eyebrow="Client services"
        title="Care guide"
        intro="A little care keeps good materials at their best for years. Always follow the care label first."
      />
      <ContentSection title="Wool and knitwear">
        <ul>
          <li>Air between wears rather than washing often.</li>
          <li>Fold knitwear; hanging stretches it.</li>
          <li>Dry clean or hand wash cool, as the label says, and dry flat.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Leather">
        <ul>
          <li>Keep bags stuffed and in their dust bag when not in use.</li>
          <li>Wipe with a soft dry cloth; avoid water and direct heat.</li>
          <li>Condition occasionally with a product suited to smooth leather.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Suede">
        <ul>
          <li>Brush with a suede brush to lift the nap.</li>
          <li>Protect with a suede spray before the first wear, and avoid rain.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Silk and satin">
        <ul>
          <li>Dry clean, and store away from sunlight.</li>
          <li>Keep satin shoes in their dust bags to protect the finish.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Jewellery">
        <ul>
          <li>Put jewellery on last, after perfume and lotions.</li>
          <li>Store pieces separately so they don&rsquo;t scratch each other.</li>
          <li>Wipe pearls with a soft cloth after wearing.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Repairs">
        <p>
          For resoling, hardware or other repairs, <Link href="/client-services">contact client
          services</Link>.
        </p>
      </ContentSection>
    </>
  );
}
