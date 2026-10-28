import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// Draft copy: review before launch. Contact details come from `contact` in
// src/lib/catalog.ts (placeholders until replaced).

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Atelier client services about orders, deliveries, returns and repairs.",
};

export default function ContactPage() {
  return (
    <>
      <ContentHeader
        eyebrow="Client services"
        title="Contact us"
        intro="Our client advisors can help with orders, sizing, deliveries, returns and repairs."
      />
      <ContentSection title="Email">
        <p>
          Write to <a href={`mailto:${contact.email}`}>{contact.email}</a>. We reply {contact.hours}.
        </p>
        <p>
          If your message is about an order, include its order number. You&rsquo;ll find it in{" "}
          <Link href="/account/orders">your orders</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Quick answers">
        <ul>
          <li>
            <Link href="/client-services/shipping">Shipping</Link>: delivery times and where we
            deliver.
          </li>
          <li>
            <Link href="/client-services/returns">Returns</Link>: free within 30 days.
          </li>
          <li>
            <Link href="/client-services/care">Care guide</Link>: keeping pieces at their best.
          </li>
          <li>
            <Link href="/appointments">Appointments</Link>: private styling in store or by video.
          </li>
        </ul>
      </ContentSection>
    </>
  );
}
