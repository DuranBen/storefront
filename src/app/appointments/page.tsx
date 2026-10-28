import type { Metadata } from "next";
import Link from "next/link";
import { ContentHeader, ContentPage, ContentSection } from "@/components/content-page";
import { contact, stores } from "@/lib/catalog";

// Draft copy: review before launch. Bookings are made by email for now.

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Private styling with an Atelier client advisor, in store or by video.",
};

export default function AppointmentsPage() {
  const subject = encodeURIComponent("Appointment request");
  return (
    <ContentPage>
      <ContentHeader
        eyebrow="Stores"
        title="Book an appointment"
        intro="Spend unhurried time with a client advisor, in one of our stores or by video call."
      />
      <ContentSection title="What to expect">
        <ul>
          <li>Styling for an occasion, a season or a whole wardrobe.</li>
          <li>Help finding your size, with pieces set aside for you to try.</li>
          <li>Gift advice, with our signature wrapping.</li>
        </ul>
        <p>Appointments are complimentary and last about an hour.</p>
      </ContentSection>
      <ContentSection title="How to book">
        <p>
          Email <a href={`mailto:${contact.email}?subject=${subject}`}>{contact.email}</a> with
          your preferred store ({stores.map((s) => s.city).join(", ")}) or video, two or three
          dates and times, and anything you&rsquo;d like us to prepare. We&rsquo;ll confirm by
          email.
        </p>
      </ContentSection>
      <ContentSection title="Our stores">
        <p>
          Opening hours and locations are on <Link href="/stores">find a store</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
