"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";

type Mode = "sign-in" | "sign-up";
type State = { error?: string; email?: string; name?: string };

const MIN_PASSWORD = 10;
const MAX_PASSWORD = 128;

/** Map Better Auth error codes to messages; never echo raw server text. */
function errorMessage(error: { status: number; code?: string }, mode: Mode) {
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email or password is incorrect.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT":
      return `Use at least ${MIN_PASSWORD} characters for your password.`;
    case "PASSWORD_TOO_LONG":
      return `Use at most ${MAX_PASSWORD} characters for your password.`;
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
  }
  return mode === "sign-in"
    ? "We couldn't sign you in. Please try again."
    : "We couldn't create your account. Please try again.";
}

/**
 * Email/password sign-in or sign-up. Submits through the Better Auth client
 * (so its rate limiting applies) from a React client action: before
 * hydration React renders the form so a submit can't fall back to a GET
 * that would put the password in the URL.
 */
export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const destination = safeNext(next);

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const name = String(formData.get("name") ?? "").trim();

      const { error } =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });

      if (error) return { error: errorMessage(error, mode), email, name };

      // The session cookie is set; re-render server components for the new user.
      router.replace(destination);
      router.refresh();
      return {};
    },
    {},
  );

  const otherHref = `/${mode === "sign-in" ? "sign-up" : "sign-in"}${
    next ? `?next=${encodeURIComponent(destination)}` : ""
  }`;

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <form action={formAction} className="space-y-5">
        {mode === "sign-up" && (
          <div>
            <label htmlFor="auth-name" className="label-caps">
              Name
            </label>
            <input
              id="auth-name"
              name="name"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              defaultValue={state.name}
              className="field mt-2"
            />
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="label-caps">
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={state.email}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "auth-error" : undefined}
            className="field mt-2"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="label-caps">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={mode === "sign-up" ? MIN_PASSWORD : undefined}
            maxLength={MAX_PASSWORD}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={
              [mode === "sign-up" && "auth-password-hint", state.error && "auth-error"]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className="field mt-2"
          />
          {mode === "sign-up" && (
            <p id="auth-password-hint" className="mt-2 text-body-sm text-muted">
              At least {MIN_PASSWORD} characters.
            </p>
          )}
        </div>

        {state.error && (
          <p id="auth-error" role="alert" className="text-body-sm text-sale">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-8 hairline-t pt-8 text-center text-body-sm text-muted">
        {mode === "sign-in" ? "New to Atelier?" : "Already have an account?"}{" "}
        <Link href={otherHref} className="link text-ink">
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
