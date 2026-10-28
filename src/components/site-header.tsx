"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { CART_CHANGE_EVENT, CART_COUNT_COOKIE, parseCount } from "@/lib/cart-cookie";
import { menuLinks } from "@/lib/catalog";
import {
  BagIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "./icons";
import { ThemeToggle } from "./theme-toggle";

function subscribeToCart(onChange: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  // Another tab may have changed the bag.
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** Item count from the cart_count cookie, so the header never needs a server render. */
const readCartCount = () =>
  parseCount(
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${CART_COUNT_COOKIE}=`))
      ?.slice(CART_COUNT_COOKIE.length + 1),
  );

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > 24;

const secondaryLinks = [
  { label: "My account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Client services", href: "/client-services" },
  { label: "Find a store", href: "/stores" },
];

/**
 * Sticky header. Over a page section marked `data-header-overlay` it starts
 * transparent with white type, and turns solid once the page scrolls.
 */
export function SiteHeader() {
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);
  const cartCount = useSyncExternalStore(subscribeToCart, readCartCount, () => 0);
  const menuRef = useRef<HTMLDialogElement>(null);

  const openMenu = () => menuRef.current?.showModal();
  const closeMenu = () => menuRef.current?.close();

  return (
    <>
      <header
        data-scrolled={scrolled || undefined}
        className="sticky top-0 z-40 hairline-b bg-paper text-ink transition-colors header-overlay:border-transparent header-overlay:bg-transparent header-overlay:text-white"
      >
        <div className="container-page grid h-header grid-cols-[1fr_auto_1fr] items-center">
          <div className="-ml-3 flex items-center">
            <button
              type="button"
              onClick={openMenu}
              aria-haspopup="dialog"
              className="btn-icon w-auto gap-3 px-3"
            >
              <MenuIcon />
              <span className="label-caps hidden md:inline">Menu</span>
            </button>
            <Link href="/search" aria-label="Search" className="btn-icon hidden md:inline-flex">
              <SearchIcon />
            </Link>
          </div>

          <Link
            href="/"
            className="font-display text-[1.375rem] uppercase tracking-[0.22em] lg:text-[1.75rem]"
          >
            Atelier
          </Link>

          <nav aria-label="Account" className="-mr-3 flex items-center justify-end">
            <Link href="/search" aria-label="Search" className="btn-icon md:hidden">
              <SearchIcon />
            </Link>
            {/* On small screens it's in the menu, where there's room. */}
            <ThemeToggle className="btn-icon hidden md:inline-flex" />
            <Link href="/account" aria-label="Account" className="btn-icon hidden md:inline-flex">
              <UserIcon />
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="btn-icon hidden md:inline-flex">
              <HeartIcon />
            </Link>
            <Link
              href="/bag"
              aria-label={
                cartCount > 0
                  ? `Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                  : "Shopping bag"
              }
              className="btn-icon relative"
            >
              <BagIcon />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.625rem] leading-none text-paper tabular-nums header-overlay:bg-white header-overlay:text-night"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <dialog
        ref={menuRef}
        aria-label="Menu"
        onClick={(e) => {
          // Clicks on the backdrop land on the <dialog> element itself.
          if (e.target === e.currentTarget) closeMenu();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink transition-transform duration-300 backdrop:bg-black/40 starting:open:-translate-x-full md:max-w-md"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-header shrink-0 items-center px-gutter">
            <button
              type="button"
              onClick={closeMenu}
              className="btn-icon -ml-3 w-auto gap-3 px-3"
            >
              <CloseIcon />
              <span className="label-caps">Close</span>
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto px-gutter py-8">
            <ul className="space-y-4">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={closeMenu} className="display-sm link-quiet">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-12 space-y-4 hairline-t pt-8">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={closeMenu} className="label-caps link-quiet">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <ThemeToggle withLabel className="link-quiet -ml-0.5 inline-flex items-center gap-3" />
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}
