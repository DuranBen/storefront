import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

export const config = {
  matcher: "/products/:slug",
};

/**
 * Product pages stream from a shared shell, so by the time the page could
 * call notFound() the response has already started with a 200. Reject
 * unknown slugs here, before rendering, so they get a real 404 status.
 * This runs on every product request: keep it to the indexed slug lookup.
 */
export async function proxy(request: NextRequest) {
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
