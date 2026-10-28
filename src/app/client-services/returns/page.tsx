import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// Draft copy: review before launch.

export const metadata: Metadata = {
  title: "Returns",
  description: "Free returns within 30 days, collected from your door.",
};

export default function ReturnsPage() {
  return (
    <>
      <ContentHeader
        eyebrow="Client services"
        title="Returns"
        intro="If something isn't right, you can return it free of charge within 30 days of delivery."
      />
      <ContentSection title="How to return">
        <ul>
          <li>
            Email <a href={`mailto:${contact.email}`}>{contact.email}</a> with your order number,
            which you&rsquo;ll find in <Link href="/account/orders">your orders</Link>.
          </li>
          <li>We&rsquo;ll arrange a free collection from your door at a time that suits you.</li>
          <li>Pack the pieces in their original packaging, with any tags still attached.</li>
        </ul>
      </ContentSection>
      <ContentSection title="Refunds">
        <p>
          Once we&rsquo;ve received and checked your return, we refund it to your original payment
          method. Refunds can take 5–10 days to reach your account, and your order will show as
          refunded.
        </p>
      </ContentSection>
      <ContentSection title="What can't be returned">
        <p>
          Pieces that have been worn, altered or damaged, and earrings for hygiene reasons unless
          they&rsquo;re faulty.
        </p>
      </ContentSection>
      <ContentSection title="Faulty pieces">
        <p>
          If something arrives damaged or develops a fault, contact us and we&rsquo;ll repair or
          replace it, or refund you.
        </p>
      </ContentSection>
    </>
  );
}
