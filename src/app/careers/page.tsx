import type { Metadata } from "next";
import { ContentHeader, ContentPage, ContentSection } from "@/components/content-page";
import { contact } from "@/lib/catalog";

// Draft copy: review before launch. List open roles here when there are any.

export const metadata: Metadata = {
  title: "Careers",
  description: "Work with Atelier, in our stores, studio and client services.",
};

export default function CareersPage() {
  return (
    <ContentPage>
      <ContentHeader
        eyebrow="The house"
        title="Careers"
        intro="We're a small team who care about making things well and looking after the people who wear them."
      />
      <ContentSection title="Where we work">
        <ul>
          <li>
            <strong>Stores:</strong> client advisors and store teams.
          </li>
          <li>
            <strong>Client services:</strong> helping customers by email and appointment.
          </li>
          <li>
            <strong>Studio:</strong> design, production and merchandising.
          </li>
        </ul>
      </ContentSection>
      <ContentSection title="Open roles">
        <p>
          There are no open roles right now. We&rsquo;re always glad to hear from people who share
          our approach: send your CV and a short note to{" "}
          <a href={`mailto:${contact.careersEmail}`}>{contact.careersEmail}</a>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
