import type { Metadata } from "next";
import { ContentHeader, ContentSection } from "@/components/content-page";

// DRAFT: review before launch. The table lists every cookie the site sets
// (src/lib/cart-store.ts, src/lib/cart-cookie.ts, Better Auth). Update it
// whenever a cookie is added, and before adding analytics or advertising.

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "The cookies Atelier uses and why.",
};

const cookies = [
  {
    name: "better-auth.session_token",
    purpose: "Keeps you signed in. Prefixed __Secure- over HTTPS.",
    lasts: "30 days",
  },
  { name: "cart", purpose: "The pieces in your bag and their quantities.", lasts: "30 days" },
  { name: "cart_count", purpose: "The number shown on the bag icon.", lasts: "30 days" },
  {
    name: "cart_checkout",
    purpose: "Which checkout your bag went to, so paid pieces leave the bag.",
    lasts: "30 days",
  },
];

export default function CookiesPage() {
  return (
    <>
      <ContentHeader
        eyebrow="Legal"
        title="Cookie policy"
        intro="We use only the cookies the shop needs to work. We don't use advertising or tracking cookies."
      />
      <ContentSection title="The cookies we set">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-body-sm">
            <thead>
              <tr className="hairline-b">
                <th scope="col" className="label-caps py-3 pr-4 text-ink">
                  Name
                </th>
                <th scope="col" className="label-caps py-3 pr-4 text-ink">
                  Purpose
                </th>
                <th scope="col" className="label-caps py-3 text-ink">
                  Lasts
                </th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((cookie) => (
                <tr key={cookie.name} className="hairline-b align-top">
                  <td className="py-3 pr-4 font-mono text-caption text-ink">{cookie.name}</td>
                  <td className="py-3 pr-4">{cookie.purpose}</td>
                  <td className="py-3 whitespace-nowrap">{cookie.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentSection>
      <ContentSection title="Your choices">
        <p>
          Because these cookies are needed for signing in and for your bag, the shop won&rsquo;t
          work properly without them. You can still delete them at any time in your browser
          settings.
        </p>
      </ContentSection>
    </>
  );
}
