"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type SectionLink = {
  href: string;
  label: string;
  /** Shown instead of `label` in the tab row, to fit a phone's width. */
  shortLabel?: string;
  /** Highlight only on this exact path (an overview), not on sub-pages. */
  exact?: boolean;
};

type SectionNavProps = {
  label: string;
  links: SectionLink[];
  /** Pinned after the links: right of the tabs, below the sidebar list. */
  trailing?: ReactNode;
};

const isCurrent = (pathname: string | null, link: SectionLink) =>
  pathname !== null &&
  (pathname === link.href || (!link.exact && pathname.startsWith(`${link.href}/`)));

/**
 * Section navigation (account, admin) with the current page highlighted.
 * Reading the pathname is URL data, so render this inside <Suspense> with
 * <SectionNavLinks pathname={null} … /> as the fallback: dynamic routes share
 * one prerendered shell that can't know the URL.
 */
export function SectionNav(props: SectionNavProps) {
  return <SectionNavLinks {...props} pathname={usePathname()} />;
}

/** The links themselves: a row of tabs on small screens, a sidebar list from lg. */
export function SectionNavLinks({
  label,
  links,
  trailing,
  pathname,
}: SectionNavProps & { pathname: string | null }) {
  return (
    <nav aria-label={label}>
      <ul className="no-scrollbar -mx-gutter flex gap-5 overflow-x-auto hairline-b px-gutter lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:px-0">
        {links.map((link) => {
          const current = isCurrent(pathname, link);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : current ? "true" : undefined}
                className={`label-caps block border-b py-3 lg:border-b-0 lg:py-2 ${
                  current
                    ? "border-ink text-ink lg:underline lg:underline-offset-[0.4em]"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {link.shortLabel ? (
                  <>
                    <span className="lg:hidden">{link.shortLabel}</span>
                    <span className="hidden lg:inline">{link.label}</span>
                  </>
                ) : (
                  link.label
                )}
              </Link>
            </li>
          );
        })}
        {trailing && (
          <li className="ml-auto shrink-0 lg:mt-6 lg:ml-0 lg:hairline-t lg:pt-6">{trailing}</li>
        )}
      </ul>
    </nav>
  );
}
