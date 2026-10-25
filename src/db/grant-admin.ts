// Grants or revokes the admin role for an existing user, by email.
//
//   npm run admin:grant -- someone@example.com
//   npm run admin:grant -- someone@example.com --revoke
//
// Sessions aren't cached, so the change applies on the user's next request.

import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema";

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const emails = args.filter((arg) => !arg.startsWith("--"));

  if (emails.length !== 1) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
  }

  // Better Auth stores emails lowercased.
  const email = emails[0].trim().toLowerCase();
  const role = revoke ? "customer" : "admin";

  const updated = await db
    .update(user)
    .set({ role })
    .where(eq(sql`lower(${user.email})`, email))
    .returning({ email: user.email, role: user.role });

  if (updated.length === 0) {
    console.error(`No user with email ${email}. They need to sign up first.`);
    process.exit(1);
  }

  console.log(`${updated[0].email} is now ${updated[0].role === "admin" ? "an admin" : "a customer"}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
