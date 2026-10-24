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
```

There is no test framework configured.

Setup: `cp .env.example .env` and fill in `DATABASE_URL` (Neon **pooled** connection string), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and `BETTER_AUTH_URL`.

## Architecture

Stack: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM on Neon Postgres. Import alias `@/*` → `src/*`.

**Next config (`next.config.ts`)**: `cacheComponents` and `partialPrefetching` are enabled, which changes how data fetching and caching work in Server Components versus older Next.js. Check the docs before adding dynamic data access or caching. Tailwind is wired in through a Turbopack CSS loader rule (`@tailwindcss/turbopack`), not PostCSS.

**Database (`src/db/`)**: `index.ts` exports a single `db` built with the Neon HTTP driver (`drizzle-orm/neon-http`) and throws at import time if `DATABASE_URL` is unset. The HTTP driver is stateless per query, so it does not support interactive transactions. `schema.ts` is the only schema file drizzle-kit reads (`drizzle.config.ts`), so any other schema file (e.g. the generated `auth-schema.ts`) must be re-exported from it. That re-export also makes the tables available to `db` and the Better Auth adapter.

**Auth**:
- `src/lib/auth.ts`: server-side `auth` instance using the Drizzle adapter (`provider: "pg"`). The `nextCookies()` plugin must stay **last** in `plugins`.
- `src/lib/auth-client.ts`: React client (`authClient`).
- `src/app/api/auth/[...all]/route.ts`: mounts Better Auth's handlers.

Better Auth's tables are not created yet. Generate them before auth will work:

```bash
npx @better-auth/cli generate --config src/lib/auth.ts --output src/db/auth-schema.ts
```

Then re-export them from `src/db/schema.ts` and run `db:generate` + `db:migrate` (or `db:push`).
