"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// Sign-in and sign-up go through the client SDK (src/components/auth-form.tsx)
// rather than server actions: Better Auth applies rate limiting, disabled
// paths and its origin check in its HTTP handler, which direct auth.api.*
// calls skip.

/** Ends the session (deletes the row, clears the cookie) and goes home. */
export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // Already signed out (no or expired session): nothing to end.
    if (!isAPIError(error)) throw error;
  }
  redirect("/");
}
