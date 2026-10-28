import type { Metadata } from "next";
import { ContentHeader, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// DRAFT: review before launch. Don't claim conformance until an audit has
// been done; this states the target and how to report problems.

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Atelier's commitment to an accessible shop, and how to tell us about problems.",
};

export default function AccessibilityPage() {
  return (
    <>
      <ContentHeader
        eyebrow="Legal"
        title="Accessibility"
        intro="We want everyone to be able to browse and buy from Atelier, whatever device or assistive technology they use."
      />
      <ContentSection title="Our goal">
        <p>
          We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We design
          for keyboard use, screen readers, zoom and reduced motion, and we keep working on it.
        </p>
      </ContentSection>
      <ContentSection title="Payment">
        <p>
          Payment takes place on Stripe&rsquo;s hosted checkout page. If you have trouble there,
          let us know and we&rsquo;ll raise it with Stripe.
        </p>
      </ContentSection>
      <ContentSection title="Tell us about a problem">
        <p>
          If something on the site is hard to use, email{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> with the page and what happened,
          and we&rsquo;ll help you finish what you were doing.
        </p>
      </ContentSection>
    </>
  );
}
