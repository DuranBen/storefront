"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/details", label: "Account details" },
];

/**
 * Account section navigation: a row of tabs on small screens, a sidebar
 * list from lg. Client-only for the active state; it never reads the session.
 */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      <ul className="no-scrollbar -mx-gutter flex gap-6 overflow-x-auto hairline-b px-gutter lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:px-0">
        {links.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`label-caps block border-b py-3 lg:border-b-0 lg:py-2 ${
                  current
                    ? "border-ink text-ink lg:underline lg:underline-offset-[0.4em]"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="ml-auto shrink-0 lg:mt-6 lg:ml-0 lg:hairline-t lg:pt-6">
          <form action={signOut}>
            <button
              type="submit"
              className="label-caps block cursor-pointer py-3 text-muted hover:text-ink lg:py-2"
            >
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
