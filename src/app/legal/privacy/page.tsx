import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// DRAFT: a generic starting point written from what this site actually
// collects. Have it reviewed by a lawyer before launch, and keep it in step
// with the code (new data, new providers).

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal information Atelier collects, why, and your choices.",
};

export default function PrivacyPage() {
  return (
    <>
      <ContentHeader eyebrow="Legal" title="Privacy policy" intro="What we collect, why, and the choices you have." />
      <ContentSection title="What we collect">
        <ul>
          <li>
            <strong>Your account:</strong> your name, email address and password. Passwords are
            stored only in hashed form; we can&rsquo;t read them.
          </li>
          <li>
            <strong>Your orders:</strong> what you bought, the prices and totals, your email
            address and your delivery address.
          </li>
          <li>
            <strong>Your wishlist and bag:</strong> the pieces you save or add.
          </li>
          <li>
            <strong>Newsletter:</strong> your email address, if you sign up.
          </li>
          <li>
            <strong>Security information:</strong> such as IP address and browser details, used to
            keep accounts secure and to limit repeated sign-in attempts.
          </li>
        </ul>
      </ContentSection>
      <ContentSection title="Payments">
        <p>
          Payments are processed by Stripe on its secure payment page. Your card details go
          directly to Stripe; we never see or store them. Stripe tells us whether a payment
          succeeded and shares the delivery address you entered there.
        </p>
      </ContentSection>
      <ContentSection title="How we use it">
        <ul>
          <li>To run your account and show you your orders.</li>
          <li>To take payment, deliver your order and handle returns and refunds.</li>
          <li>To send the newsletter, if you&rsquo;ve asked for it.</li>
          <li>To keep the site secure and prevent fraud.</li>
        </ul>
        <p>We don&rsquo;t sell your personal information.</p>
      </ContentSection>
      <ContentSection title="Who we share it with">
        <p>
          Only the service providers that help us run the shop: payment processing (Stripe), and
          the companies that host our website and database. They may use your information only to
          provide those services to us.
        </p>
      </ContentSection>
      <ContentSection title="How long we keep it">
        <p>
          We keep your account until you ask us to close it. We keep order records for as long as
          the law requires for tax and accounting.
        </p>
      </ContentSection>
      <ContentSection title="Your choices">
        <p>
          You can update your name in <Link href="/account/details">your account details</Link>.
          To get a copy of your information, correct it, delete your account or unsubscribe from
          the newsletter, email <a href={`mailto:${contact.privacyEmail}`}>{contact.privacyEmail}</a>.
        </p>
      </ContentSection>
      <ContentSection title="Cookies">
        <p>
          See our <Link href="/legal/cookies">cookie policy</Link>.
        </p>
      </ContentSection>
    </>
  );
}
