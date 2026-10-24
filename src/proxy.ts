import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export const config = {
  matcher: ["/products/:slug", "/collections/:slug"],
};

/**
 * Product and collection pages stream from a shared shell, so by the time
 * the page could call notFound() the response has already started with a
 * 200. Reject unknown slugs here, before rendering, so they get a real 404
 * status. This runs on every such request: keep it to the indexed slug lookup.
 */
export async function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  const table = section === "collections" ? categories : products;
  const [found] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.slug, slug))
    .limit(1);

  if (!found) {
    // No route matches this path, so Next renders the not-found page with a 404.
    return NextResponse.rewrite(new URL(`/${section}-not-found`, request.url));
  }
}
