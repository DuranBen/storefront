# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS, with Better Auth, Drizzle ORM and Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run dev
```

## Project structure

- `src/db/index.ts`: Drizzle client (Neon HTTP driver)
- `src/db/schema.ts`: Drizzle table definitions
- `drizzle.config.ts`: drizzle-kit config (migrations output to `./drizzle`)
- `src/lib/auth.ts`: Better Auth server instance (Drizzle adapter)
- `src/lib/auth-client.ts`: Better Auth React client
- `src/app/api/auth/[...all]/route.ts`: Better Auth route handler

## Database scripts

- `npm run db:generate`: generate SQL migrations from the schema
- `npm run db:migrate`: apply migrations
- `npm run db:push`: push the schema directly (prototyping)
- `npm run db:studio`: open Drizzle Studio

Generate Better Auth's tables before using auth:

```bash
npx @better-auth/cli generate --config src/lib/auth.ts --output src/db/auth-schema.ts
```
