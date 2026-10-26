# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The App Router guides are in `node_modules/next/dist/docs/01-app/`.

## Commands

```bash
npm run dev          # dev server (Turbopack) on http://localhost:3000
npm run build        # production build (also type-checks)
npm run lint         # ESLint 9 flat config (eslint.config.mjs)
npx tsc --noEmit     # type-check only

npm run db:generate  # generate SQL migrations from src/db/schema.ts into ./drizzle
npm run db:migrate   # apply migrations
npm run db:push      # push schema directly (prototyping only)
npm run db:studio    # Drizzle Studio
npm run admin:grant -- <email> [--revoke]  # give an existing user the admin role
```

There is no test framework configured.

Setup: `cp .env.example .env` and fill in `DATABASE_URL` (Neon **pooled** connection string), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and `BETTER_AUTH_URL` (also used for Stripe's redirect URLs). For checkout, add `STRIPE_SECRET_KEY` (a restricted `rk_test_…` key from a Stripe sandbox) and `STRIPE_WEBHOOK_SECRET`; locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints the webhook secret.

## Architecture

Stack: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM on Neon Postgres. Import alias `@/*` → `src/*`.

**Next config (`next.config.ts`)**: `cacheComponents` and `partialPrefetching` are enabled, which changes how data fetching and caching work in Server Components versus older Next.js. Check the docs before adding dynamic data access or caching. Tailwind is wired in through a Turbopack CSS loader rule (`@tailwindcss/turbopack`), not PostCSS.

**Database (`src/db/`)**: `index.ts` exports a single `db` built with the Neon HTTP driver (`drizzle-orm/neon-http`) and throws at import time if `DATABASE_URL` is unset. The HTTP driver is stateless per query, so it does not support interactive transactions. `schema.ts` is the only schema file drizzle-kit reads (`drizzle.config.ts`), so any other schema file (e.g. the generated `auth-schema.ts`) must be re-exported from it. That re-export also makes the tables available to `db` and the Better Auth adapter. Use migrations (`db:generate` + `db:migrate`) for every schema change. Although interactive transactions aren't supported, `db.batch([...])` runs its statements as one transaction.

**Orders**: `orders` belong to a signed-in `user` (`ON DELETE RESTRICT`) and keep the order lifecycle (`status`: pending / confirmed / canceled / expired) separate from what Stripe reports (`payment_status`: unpaid / processing / paid / failed); check constraints keep them consistent (`confirmed` requires `paid`, and `paid_at` is set exactly when paid). `order_items` snapshot name, size, image and unit price per stock row, so catalogue changes never rewrite an order, and RESTRICT foreign keys stop ordered stock or products being deleted. `stripe_events` records webhook event ids for idempotent processing.

**Checkout** (Stripe-hosted Checkout Sessions; `src/lib/orders.ts`, `src/lib/checkout-actions.ts`):
- `startCheckout` revalidates the cart against live stock, then `reserveOrder` creates the pending order and decrements stock in one `db.batch`; `stock_quantity_check` rolls it all back rather than oversell. Session line items use inline `price_data` from database prices; never accept prices or totals from the client.
- **Only the webhook (`src/app/api/stripe/webhook/route.ts`) marks an order paid**, from signature-verified `checkout.session.completed` / `async_payment_succeeded` events, after checking the amount against the order. The success page only reads the order and refreshes until it's confirmed.
- Stock is returned exactly once by `releaseOrder` (expired, canceled or failed payment), whether from the webhook, the cancel route or the overdue-reservation sweep. Keep state changes as single conditional statements so duplicate events and retries stay harmless.

**Auth** (email/password only; no email verification or password reset yet):
- `src/lib/auth.ts`: server-side `auth` instance using the Drizzle adapter (`provider: "pg"`). The `nextCookies()` plugin must stay **last** in `plugins`. Users have a `role` (`customer` | `admin`) that clients can't set (`input: false`).
- `src/lib/session.ts`: the data access layer. Check auth with `getCurrentUser()` / `requireUser()` / `requireAdmin()` in every protected page, Server Action and Route Handler, inside `<Suspense>` (they read headers). `src/proxy.ts` only does an optimistic cookie redirect for `/account` and `/admin`.
- `src/lib/auth-client.ts`: React client (`authClient`). Sign-in and sign-up must go through it, not `auth.api.*` in a Server Action: rate limiting, `disabledPaths` and the origin check only run in Better Auth's HTTP handler.
- `src/app/api/auth/[...all]/route.ts`: mounts Better Auth's handlers.
- Customers' own orders are read only through `src/lib/my-orders.ts`, whose functions resolve the customer from the session themselves (never pass a user id in).

**Admin** (`/admin/*`; grant the role with `npm run admin:grant`). Never rely on hiding links:
- `src/app/admin/layout.tsx` renders `AdminShell` (`src/components/admin/admin-shell.tsx`) inside `<Suspense>`; it calls `requireAdmin()` before rendering the title or navigation, so non-admins receive none of the admin UI, not even in the prerendered shell (its fallback is a neutral skeleton).
- **Every admin page also calls `requireAdmin()` itself** (via `AdminSection`): layouts don't re-render on client-side navigation between sibling pages.
- **Every admin Server Action must start with `await requireAdmin()`** before reading its input; admin data reads must call it too. The proxy lets POSTs through, so actions are their own only check.
- Admin reads live in `src/lib/admin.ts`, actions in `src/lib/admin-actions.ts`, product validation in `src/lib/product-input.ts` (server-side; whole-dollar prices, since the storefront shows no cents). Writes that change catalogue data call `updateTag("products")` so the cached storefront updates immediately. Stock is set with a compare-and-set on the quantity the admin saw, because checkout reserves stock concurrently.
- Inventory: `stock.quantity` is units **available to sell**; starting checkout subtracts reserved units and they return on expiry/cancel/failure. "Reserved" shown to admins is derived from pending, unreleased orders (`reservedByStock` in `admin.ts`), never stored. Admin stock writes go through `setStock` only. Every stock change expires the `products` cache immediately: `updateTag("products")` in Server Actions (admin actions, `startCheckout` after the sweep, closing earlier checkouts, reserving and releasing), `revalidateTag("products", { expire: 0 })` in Route Handlers (webhook releases, cancel route). Not `"max"`: stale-while-revalidate would show old stock to the next shopper. Release functions report whether stock actually moved (`releaseOrder` → boolean, `releaseOverdueReservations` → count, `cancelOpenOrder` → "canceled" vs "unchanged"); revalidate only then.

The auth tables live in `src/db/auth-schema.ts`, generated with the CLI matching the installed version (the old `@better-auth/cli` package stops at 1.4), then hand-edited (see its header):

```bash
npx auth@<better-auth version> generate --config src/lib/auth.ts --output src/db/auth-schema.ts
```

Re-run it after changing auth config or plugins, then `db:generate` + `db:migrate`.
