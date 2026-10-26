"use client";

import Link from "next/link";
import { SectionNav, SectionNavLinks, type SectionLink } from "../section-nav";

const links: SectionLink[] = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/orders", label: "Orders" },
];

const viewStore = (
  <Link href="/" className="label-caps hidden py-3 text-muted hover:text-ink lg:block lg:py-2">
    View store
  </Link>
);

/**
 * Admin navigation with the current section highlighted; render inside
 * <Suspense>. Only ever rendered by AdminShell, after requireAdmin().
 */
export function AdminNav() {
  return <SectionNav label="Admin" links={links} trailing={viewStore} />;
}

/** The same links without a highlight: the <Suspense> fallback. */
export function AdminNavLinks() {
  return <SectionNavLinks label="Admin" links={links} trailing={viewStore} pathname={null} />;
}
