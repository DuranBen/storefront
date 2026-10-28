import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";

// Draft copy: review before launch. Matches checkout: US addresses only
// (shipping_address_collection in src/lib/checkout-actions.ts).

export const metadata: Metadata = {
  title: "Shipping",
  description: "Complimentary tracked express delivery on every Atelier order.",
};

export default function ShippingPage() {
  return (
    <>
      <ContentHeader
        eyebrow="Client services"
        title="Shipping"
        intro="Every order ships free, by tracked express delivery, in our signature gift wrapping."
      />
      <ContentSection title="Delivery times">
        <p>
          Orders arrive in <strong>2–4 working days</strong>. We dispatch once your payment is
          confirmed; some payment methods take a few days to clear, and your pieces are reserved
          meanwhile.
        </p>
      </ContentSection>
      <ContentSection title="Where we deliver">
        <p>We currently deliver to addresses in the United States.</p>
      </ContentSection>
      <ContentSection title="Tracking your order">
        <p>
          You can follow your order&rsquo;s status in <Link href="/account/orders">your orders</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Prices">
        <p>Prices are in US dollars, and delivery is always complimentary.</p>
      </ContentSection>
    </>
  );
}
