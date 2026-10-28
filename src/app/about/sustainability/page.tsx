import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";

// Draft copy: review before launch. Avoid adding specific environmental
// claims (percentages, certifications) unless they can be substantiated.

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Atelier's approach: fewer, better pieces, made to last and to be repaired.",
};

export default function SustainabilityPage() {
  return (
    <>
      <ContentHeader
        eyebrow="The house"
        title="Sustainability"
        intro="The most sustainable piece is the one you keep wearing. That idea shapes how we design, make and sell."
      />
      <ContentSection title="Fewer, better pieces">
        <p>
          We make in small runs and restock carefully, rather than producing large quantities that
          might go unsold.
        </p>
      </ContentSection>
      <ContentSection title="Built to last">
        <p>
          We choose materials for how they age, and construct pieces so they can be repaired: shoes
          that can be resoled, bags with replaceable hardware, coats with generous seam allowances.
        </p>
      </ContentSection>
      <ContentSection title="Care and repair">
        <p>
          Looking after a piece well is the simplest way to extend its life. See our{" "}
          <Link href="/client-services/care">care guide</Link>, or{" "}
          <Link href="/client-services">contact client services</Link> about repairs.
        </p>
      </ContentSection>
      <ContentSection title="Packaging">
        <p>
          Our signature gift wrapping is designed to be kept and reused.
        </p>
      </ContentSection>
    </>
  );
}
