import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/client-services" },
      { label: "Shipping", href: "/client-services/shipping" },
      { label: "Returns", href: "/client-services/returns" },
      { label: "Care guide", href: "/client-services/care" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Craftsmanship", href: "/about/craft" },
      { label: "Sustainability", href: "/about/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Stores",
    links: [
      { label: "Find a store", href: "/stores" },
      { label: "Book an appointment", href: "/appointments" },
    ],
  },
];

const legal = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Accessibility", href: "/legal/accessibility" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-night text-white [&_:focus-visible]:outline-white">
      <div className="container-page section-sm grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="heading">Letters from the atelier</h2>
          <p className="mt-3 max-w-text text-white/70">
            New collections, private previews and stories from the workshop. No more than twice a month.
          </p>
          <div className="mt-6 max-w-lg">
            <NewsletterForm />
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7"
        >
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="eyebrow text-white/60">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-quiet text-body-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-xl uppercase tracking-[0.22em]">Atelier</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-quiet text-caption text-white/70">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
