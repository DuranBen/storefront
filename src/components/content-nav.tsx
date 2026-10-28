"use client";

import { SectionNav, SectionNavLinks, type SectionLink } from "./section-nav";

const groups = {
  house: {
    label: "The house",
    links: [
      { href: "/about", label: "Our story", exact: true },
      { href: "/about/craft", label: "Craftsmanship" },
      { href: "/about/sustainability", label: "Sustainability" },
    ],
  },
  services: {
    label: "Client services",
    links: [
      { href: "/client-services", label: "Contact us", shortLabel: "Contact", exact: true },
      { href: "/client-services/shipping", label: "Shipping" },
      { href: "/client-services/returns", label: "Returns" },
      { href: "/client-services/care", label: "Care guide", shortLabel: "Care" },
    ],
  },
  legal: {
    label: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/cookies", label: "Cookies" },
      { href: "/legal/accessibility", label: "Accessibility" },
    ],
  },
} satisfies Record<string, { label: string; links: SectionLink[] }>;

export type ContentGroup = keyof typeof groups;

/** A content group's navigation with the current page highlighted; render inside <Suspense>. */
export function ContentNav({ group }: { group: ContentGroup }) {
  return <SectionNav {...groups[group]} />;
}

/** The same links without a highlight: the <Suspense> fallback. */
export function ContentNavLinks({ group, pathname }: { group: ContentGroup; pathname: string | null }) {
  return <SectionNavLinks {...groups[group]} pathname={pathname} />;
}
