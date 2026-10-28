import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// DRAFT: a generic starting point that matches how checkout works. Have it
// reviewed by a lawyer before launch (governing law, liability, consumer rights).

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "The terms that apply when you buy from Atelier.",
};

export default function TermsPage() {
  return (
    <>
      <ContentHeader eyebrow="Legal" title="Terms of sale" intro="These terms apply when you place an order with us." />
      <ContentSection title="Your account">
        <p>
          You need an account to check out. Keep your password private; you&rsquo;re responsible for
          orders placed with your account.
        </p>
      </ContentSection>
      <ContentSection title="Prices and payment">
        <p>
          Prices are shown in US dollars and charged at the price shown when you check out. Payment
          is taken securely by Stripe. Your order is confirmed once the payment succeeds; if it
          doesn&rsquo;t, no order is placed.
        </p>
      </ContentSection>
      <ContentSection title="Availability">
        <p>
          When you start checking out, we hold your pieces for you while you pay. If you leave the
          payment page or it expires, they go back on sale. We can&rsquo;t guarantee a piece will be
          available until your order is confirmed.
        </p>
      </ContentSection>
      <ContentSection title="Delivery">
        <p>
          We deliver to addresses in the United States, free of charge. See{" "}
          <Link href="/client-services/shipping">shipping</Link> for delivery times.
        </p>
      </ContentSection>
      <ContentSection title="Returns and refunds">
        <p>
          You can return pieces within 30 days of delivery, as described in our{" "}
          <Link href="/client-services/returns">returns policy</Link>. Refunds go back to your
          original payment method.
        </p>
      </ContentSection>
      <ContentSection title="Mistakes">
        <p>
          If a price or description is clearly wrong, we&rsquo;ll contact you before dispatching and
          you can cancel for a full refund.
        </p>
      </ContentSection>
      <ContentSection title="Contact">
        <p>
          Questions about these terms: <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </ContentSection>
    </>
  );
}
