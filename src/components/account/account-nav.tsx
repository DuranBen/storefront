"use client";

import { signOut } from "@/lib/auth-actions";
import { SectionNav, SectionNavLinks, type SectionLink } from "../section-nav";

const links: SectionLink[] = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/details", label: "Account details", shortLabel: "Details" },
];

const signOutForm = (
  <form action={signOut}>
    <button
      type="submit"
      className="label-caps block cursor-pointer py-3 text-muted hover:text-ink lg:py-2"
    >
      Sign out
    </button>
  </form>
);

/** Account navigation with the current page highlighted; render inside <Suspense>. */
export function AccountNav() {
  return <SectionNav label="Account" links={links} trailing={signOutForm} />;
}

/** The same links without a highlight: the <Suspense> fallback. */
export function AccountNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <SectionNavLinks label="Account" links={links} trailing={signOutForm} pathname={pathname} />
  );
}
