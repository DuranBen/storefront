// Data access layer for the signed-in user. Every protected page, Server
// Action and Route Handler checks the session through here, against the
// database. The cookie check in src/proxy.ts is only an optimistic redirect.
//
// Reading the session reads request headers, so with Cache Components every
// caller must render inside <Suspense>. No `use cache: private` on purpose:
// a browser-cached session would outlive sign-out for its stale time.

import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth, ROLES, type Role } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

/** The raw Better Auth session, read once per request. */
const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in user, narrowed to what pages need, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  const { id, name, email, role, createdAt } = session.user;
  return {
    id,
    name,
    email,
    // The column is NOT NULL with a check constraint; anything else is a customer.
    role: ROLES.find((r) => r === role) ?? "customer",
    createdAt,
  };
}

/** The signed-in user; otherwise redirects to sign-in and back to `returnTo`. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * The signed-in admin. Signed-out visitors go to sign-in; signed-in
 * non-admins get a 404, so the admin area doesn't reveal that it exists.
 */
export async function requireAdmin(returnTo = "/admin"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") notFound();
  return user;
}
