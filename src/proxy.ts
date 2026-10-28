import { getSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { collectionPages } from "@/lib/catalog";

export const config = {
  matcher: [
    "/products/:slug",
    "/collections/:slug",
    "/account/:path*",
    "/admin/:path*",
    "/wishlist",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/products/")) return rejectUnknownProduct(request);
  if (pathname.startsWith("/collections/")) return rejectUnknownCollection(request);
  return requireSessionCookie(request);
}

/**
 * Product pages stream from a shared shell, so by the time the page could
 * call notFound() the response has already started with a 200. Reject
 * unknown slugs here, before rendering, so they get a real 404 status.
 * This runs on every product request: keep it to the indexed slug lookup.
 */
async function rejectUnknownProduct(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  const [found] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!found) {
    // No route matches this path, so Next renders the not-found page with a 404.
    return NextResponse.rewrite(new URL("/products-not-found", request.url));
  }
}

/**
 * The same for collection pages: an editorial collection (a static list) or
 * a category, else a real 404.
 */
async function rejectUnknownCollection(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (collectionPages.some((c) => c.slug === slug)) return;
  const [found] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!found) return NextResponse.rewrite(new URL("/collections-not-found", request.url));
}

/**
 * Optimistic check for signed-in areas: no session cookie means a real
 * redirect to sign-in before anything streams. This only looks at the
 * cookie (proxy also runs on prefetches); pages verify the session against
 * the database with requireUser() / requireAdmin().
 *
 * Only page navigations are redirected. Server Actions POST to the page's
 * URL and authorize themselves; answering one with a redirect to the
 * sign-in HTML would break it silently instead of letting its own
 * requireUser() redirect the client.
 */
function requireSessionCookie(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return;
  if (getSessionCookie(request)) return;

  const { pathname, search } = request.nextUrl;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", pathname + search);
  return NextResponse.redirect(signIn);
}
