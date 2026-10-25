"use server";

import { isAPIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { requireUser } from "./session";

const MAX_NAME = 100;

export type UpdateNameState =
  | { status: "idle" }
  | { status: "saved"; name: string }
  | { status: "invalid"; name: string; message: string }
  | { status: "error"; name: string; message: string };

/** Changes the signed-in user's display name. Authorizes itself. */
export async function updateName(
  _prev: UpdateNameState,
  formData: FormData,
): Promise<UpdateNameState> {
  await requireUser("/account/details");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "invalid", name, message: "Enter your name." };
  if (name.length > MAX_NAME) {
    return { status: "invalid", name, message: `Use at most ${MAX_NAME} characters.` };
  }

  try {
    await auth.api.updateUser({ body: { name }, headers: await headers() });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    return { status: "error", name, message: "We couldn't save your name. Please try again." };
  }

  // Re-render the account pages with the new name.
  refresh();
  return { status: "saved", name };
}

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
