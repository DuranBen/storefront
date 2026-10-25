/**
 * Where to go after signing in: a same-origin path from `?next=`, or the
 * account page. Rejects absolute and protocol-relative URLs (open redirects).
 * Shared by server pages and the client sign-in form.
 */
export function safeNext(next: unknown, fallback = "/account") {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
