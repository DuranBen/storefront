import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";

/** Bytes of key material in a hex- or base64-encoded secret; 0 if it's neither. */
function keyBytes(secret: string) {
  if (/^[0-9a-f]+$/i.test(secret) && secret.length % 2 === 0) return secret.length / 2;
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(secret) || /^[A-Za-z0-9_-]+$/.test(secret)) {
    return Buffer.from(secret, "base64").length;
  }
  return 0;
}

/**
 * Better Auth signs session cookies and email-verification JWTs (HS256) with
 * this secret, but only warns when it looks weak, and silently falls back to
 * a public default outside production. Refuse to start unless every secret in
 * use is a generated key of at least 32 bytes (`openssl rand -base64 32`).
 * Rotated keys in BETTER_AUTH_SECRETS are checked too: an old weak key can
 * still verify forged tokens.
 */
function assertStrongSecrets() {
  const rotated = process.env.BETTER_AUTH_SECRETS;
  const secrets = rotated
    ? rotated.split(",").map((entry) => entry.slice(entry.indexOf(":") + 1).trim())
    : [process.env.BETTER_AUTH_SECRET ?? ""];

  for (const secret of secrets) {
    if (keyBytes(secret) < 32) {
      throw new Error(
        `${rotated ? "Every BETTER_AUTH_SECRETS entry" : "BETTER_AUTH_SECRET"} must be a randomly generated key of at least 32 bytes, base64- or hex-encoded. Generate one with \`openssl rand -base64 32\`.`,
      );
    }
  }
}

assertStrongSecrets();

export const ROLES = ["customer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // input: false, so neither sign-up nor update-user can set it. Admins
      // are granted from the command line (npm run admin:grant).
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  // 30-day sessions, extended at most once a day while in use.
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: {
    // On in development too (the default is production only) so it can be
    // tested. Stored in Postgres: in-memory counters are per server instance.
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  // Email isn't set up. These endpoints are mounted regardless, and
  // verify-email acts on any token signed with the secret, so keep them off
  // until verification and password reset are configured.
  disabledPaths: [
    "/verify-email",
    "/send-verification-email",
    "/request-password-reset",
    "/reset-password",
  ],
  // nextCookies must be the last plugin.
  plugins: [nextCookies()],
});
