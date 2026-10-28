# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The App Router guides are in `node_modules/next/dist/docs/01-app/`. `cacheComponents` and `partialPrefetching` are on (`next.config.ts`): check the docs before adding request data or caching. Tailwind v4 is wired through a Turbopack loader rule, not PostCSS.

## Working in this repo

- No test framework: verify with `npx tsc --noEmit`, `npm run lint` and `npm run build`, and by running the app.
- Run the app on the origin in `BETTER_AUTH_URL` (`http://localhost:3000` locally): Better Auth's origin check and Stripe's success/cancel redirects both use it.
- Env: `DATABASE_URL` (Neon **pooled** string), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`; weak secrets are refused at startup), `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY` (restricted `rk_test_…` key), `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET` (32+ characters).
- Local webhooks: `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,charge.dispute.created,charge.dispute.updated,charge.dispute.closed --forward-to localhost:3000/api/stripe/webhook`. The deployed endpoint needs the same events.
- Admin role: only via `npm run admin:grant -- <email> [--revoke]`; clients can never set `role`.

## Database

- Every schema change goes through migrations (`db:generate` + `db:migrate`), never `db:push`.
- `schema.ts` is the only file drizzle-kit reads, so other schema files (the generated `auth-schema.ts`) must be re-exported from it.
- The Neon HTTP driver has no interactive transactions; `db.batch([...])` is the transaction. Keep every state change a single conditional statement (or one batch), so duplicate webhooks, retries and races are harmless.
- Drizzle prints columns unqualified in single-table selects: inside a raw `sql` subquery, `${orders.id}` becomes `"id"` and binds to the subquery's table. Qualify by hand there.
- `auth-schema.ts` is generated with `npx auth@<installed better-auth version> generate --config src/lib/auth.ts --output src/db/auth-schema.ts` (the old `@better-auth/cli` stops at 1.4), then hand-edited (see its header). Re-run after changing auth config or plugins.

## Auth and authorization

- Check the session with `getCurrentUser()` / `requireUser()` / `requireAdmin()` (`src/lib/session.ts`) in every protected page, Server Action and Route Handler, inside `<Suspense>`. `src/proxy.ts` only redirects page loads with no session cookie; it lets POSTs through.
- Sign-in and sign-up go through `authClient`, never `auth.api.*` in a Server Action: rate limiting, `disabledPaths` and the origin check only run in Better Auth's HTTP handler. `nextCookies()` stays last in `plugins`.
- Customer data is read only through modules that take the customer from the session (`my-orders.ts`, `wishlist.ts`); never pass a user id in.
- Parse client input strictly: numbers from strings must be plain digits (`Number("")` is 0, which would remove a cart line). Never accept prices or totals from the client.
- **Admin**: every admin page calls `requireAdmin()` itself (layouts don't re-render on client navigation), and every admin Server Action starts with `await requireAdmin()` before reading input. A page renders apart from its layout, so **all admin UI, back links included, must render after that check** (inside `AdminSection`, its `back` prop, or after a `getAdmin…()` read); anything outside reaches non-admins. Non-admins get a 404. Every export of `src/lib/admin.ts` authorizes itself.

## Orders, checkout and payments

- Order lifecycle (`status`) is kept apart from what Stripe reports (`payment_status`). Order lines snapshot name, size, image and price.
- **Only the webhook marks an order paid**, after verifying the signature and checking the amount and currency. The success page only reads.
- Session line items use `price_data` from database prices.
- **One open checkout per customer** (partial unique index on pending + unpaid). Sessions are attached only to orders still open, and releases are conditional on the session the caller saw, so a released order never has a payable session.
- `stock.quantity` is units available to sell: reserving subtracts and `releaseOrder` returns them exactly once. "Reserved" is derived from open orders, never stored. Admin stock writes are compare-and-set (`setStock`).
- Open orders are closed with `closeOpenOrder`: expire the Stripe session first, then release; a `complete` session keeps its stock. The overdue sweep does the same, so a paid order whose webhook is late is never resold. It runs in `after()` from `startCheckout` and from `GET /api/cron/sweep` (Bearer `CRON_SECRET`; schedule it every few minutes).
- Stripe's Back link lands on `/checkout/cancel`, which changes nothing on GET; cancelling is the page's POST action.
- The bag is a cookie the webhook can't touch: `cart_checkout` remembers the order, and `settleBag` (confirmation page and bag) removes that order's pieces once paid.
- Money without a confirmed order (paid after release, amount mismatch) is stored as `paid` but not `confirmed`, never released, and shown to admins as "needs attention". Refunds and disputes are made in the Stripe Dashboard and recorded by the webhook; the admin Orders pages are read-only.
- Prices are whole dollars, at least $1 (the storefront shows no cents; Stripe has a minimum charge).

## Caching

- Catalogue reads are `"use cache"` functions tagged `products` (`src/lib/products.ts`). Every catalogue or stock change expires the tag immediately: `updateTag("products")` in Server Actions; `revalidateTag("products", { expire: 0 })` in Route Handlers and inside `after()` (`updateTag` only works in the action itself). Never `"max"`: stale-while-revalidate would show old stock.
- Release functions report whether stock actually moved; revalidate only then.
- Per-user state on cached pages (wishlist hearts) is loaded on the client (`WishlistProvider`), not rendered into them.

## Styling

- Light and dark themes share the colour tokens in `src/styles/theme.css`; dark values are redefined under `:root[data-theme="dark"]` in `base.css`. The `<head>` script in the root layout sets `data-theme` before first paint (saved choice, else the system setting). Use the tokens, never raw colours, so both themes work.
- Surfaces that stay dark in both themes (the footer, type and buttons on photos) use the fixed `white` / `night` colours, not `paper` / `ink`, which swap.
- The router keeps previous pages in the DOM hidden with an inline `display: none`; CSS that reacts to page content (like the `header-overlay` variant) must ignore hidden pages.

## Content

- The content pages (`/about`, `/client-services`, `/legal`, `/stores`, `/appointments`, `/careers`) are **draft copy to review before launch** (privacy and terms need legal review). Contact details and stores are placeholders in `contact` and `stores` in `src/lib/catalog.ts`.
- The cookie policy must list every cookie the site sets; update it when adding one.
- Editorial collection membership lives in `collectionPages` in `src/lib/catalog.ts`.
