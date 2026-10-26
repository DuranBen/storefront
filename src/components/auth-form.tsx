"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { Spinner } from "./spinner";

type Mode = "sign-in" | "sign-up";
type Field = "name" | "email" | "password";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type FormError = { message: string; link?: { href: string; label: string } };
type FocusRequest = { field: Field; n: number };

const MIN_PASSWORD = 10;
const MAX_PASSWORD = 128;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyValues: Values = { name: "", email: "", password: "" };

function fieldsFor(mode: Mode): Field[] {
  return mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];
}

/** Client-side checks, mirroring the server's rules so most mistakes never leave the page. */
function validate(field: Field, value: string, mode: Mode): string | undefined {
  switch (field) {
    case "name":
      if (!value.trim()) return "Enter your name.";
      if (value.trim().length > MAX_NAME) return `Use at most ${MAX_NAME} characters.`;
      return;
    case "email":
      if (!value.trim()) return "Enter your email address.";
      if (value.trim().length > MAX_EMAIL || !EMAIL_PATTERN.test(value.trim())) {
        return "Enter a valid email address, like name@example.com.";
      }
      return;
    case "password":
      if (!value) return "Enter your password.";
      // Sign-in only checks presence: an old account may predate today's rules.
      if (mode === "sign-up" && value.length < MIN_PASSWORD) {
        return `Use at least ${MIN_PASSWORD} characters.`;
      }
      if (value.length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`;
      return;
  }
}

/**
 * Map a Better Auth error to field or form messages; never echo raw server
 * text. Wrong credentials stay form-level so we don't say which field was wrong.
 */
function fromServerError(
  error: { status: number; code?: string },
  mode: Mode,
  signInHref: string,
): { errors: Errors; formError?: FormError } {
  if (error.status === 429) {
    return { errors: {}, formError: { message: "Too many attempts. Please wait a minute and try again." } };
  }
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return { errors: {}, formError: { message: "Email or password is incorrect." } };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return {
        errors: { email: "An account with this email already exists." },
        formError: {
          message: "Already registered?",
          link: { href: signInHref, label: "Sign in instead" },
        },
      };
    case "INVALID_EMAIL":
      return { errors: { email: "Enter a valid email address, like name@example.com." } };
    case "PASSWORD_TOO_SHORT":
      return { errors: { password: `Use at least ${MIN_PASSWORD} characters.` } };
    case "PASSWORD_TOO_LONG":
      return { errors: { password: `Use at most ${MAX_PASSWORD} characters.` } };
  }
  return {
    errors: {},
    formError: {
      message:
        mode === "sign-in"
          ? "We couldn't sign you in. Please try again."
          : "We couldn't create your account. Please try again.",
    },
  };
}

/**
 * Email/password sign-in or sign-up. Submits through the Better Auth client
 * (so its rate limiting applies) from a React client action: before
 * hydration React renders the form so a submit can't fall back to a GET
 * that would put the password in the URL.
 *
 * Fields are uncontrolled; React resets the form after each action, so
 * `values` feeds their defaultValue to restore what the visitor typed.
 */
export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const destination = safeNext(next);
  const query = next ? `?next=${encodeURIComponent(destination)}` : "";
  const otherHref = `/${mode === "sign-in" ? "sign-up" : "sign-in"}${query}`;

  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  // Bumped to move focus to the first invalid field after a failed submit.
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const fail = (result: { values: Values; errors: Errors; formError?: FormError }) => {
    setValues(result.values);
    setErrors(result.errors);
    setFormError(result.formError ?? null);
    const first = fieldsFor(mode).find((field) => result.errors[field]);
    // With only a form-level message (e.g. wrong password), return to the password field.
    setFocusRequest((prev) => ({ field: first ?? "password", n: (prev?.n ?? 0) + 1 }));
  };

  async function submit(formData: FormData) {
    const submitted: Values = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    const invalid: Errors = {};
    for (const field of fieldsFor(mode)) {
      const message = validate(field, submitted[field], mode);
      if (message) invalid[field] = message;
    }
    if (Object.keys(invalid).length > 0) return fail({ values: submitted, errors: invalid });

    setErrors({});
    setFormError(null);

    let error: { status: number; code?: string } | null;
    try {
      ({ error } =
        mode === "sign-in"
          ? await authClient.signIn.email({ email: submitted.email, password: submitted.password })
          : await authClient.signUp.email({
              email: submitted.email,
              password: submitted.password,
              name: submitted.name,
            }));
    } catch {
      error = { status: 0 };
    }

    if (error) {
      if (error.status === 0) {
        return fail({
          values: submitted,
          errors: {},
          formError: { message: "We couldn't reach Atelier. Check your connection and try again." },
        });
      }
      const mapped = fromServerError(error, mode, `/sign-in${query}`);
      // Clear a rejected sign-in password; keep it for sign-up fixes elsewhere.
      const keepPassword = mode === "sign-up" && !mapped.errors.password;
      return fail({ values: { ...submitted, password: keepPassword ? submitted.password : "" }, ...mapped });
    }

    // The session cookie is set; re-render server components for the new user.
    // Navigating inside the action keeps the form pending until the page changes.
    router.replace(destination);
    router.refresh();
  }

  // Reward early, punish late: a field's error clears as soon as it's fixed,
  // but a new error only appears on blur (or submit), not mid-typing.
  const fieldProps = (field: Field) => ({
    defaultValue: values[field],
    error: errors[field],
    onChange: (value: string) => {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(field, value, mode) }));
    },
    onBlur: (value: string) => {
      if (value) setErrors((prev) => ({ ...prev, [field]: validate(field, value, mode) }));
    },
  });

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <form action={submit} noValidate>
        <Fieldset focusRequest={focusRequest}>
          {mode === "sign-up" && (
            <TextField
              id="auth-name"
              name="name"
              label="Name"
              type="text"
              autoComplete="name"
              maxLength={MAX_NAME}
              {...fieldProps("name")}
            />
          )}
          <TextField
            id="auth-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={MAX_EMAIL}
            {...fieldProps("email")}
          />
          <PasswordField
            mode={mode}
            hint={mode === "sign-up" ? `At least ${MIN_PASSWORD} characters.` : undefined}
            {...fieldProps("password")}
          />

          {formError && (
            <p role="alert" className="text-body-sm text-sale">
              {formError.message}
              {formError.link && (
                <>
                  {" "}
                  <Link href={formError.link.href} className="link">
                    {formError.link.label}
                  </Link>
                </>
              )}
            </p>
          )}

          <SubmitButton mode={mode} />
        </Fieldset>
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

/**
 * Disables every field while the form is submitting, and moves focus to the
 * requested field once it's enabled again (a disabled input can't take focus).
 */
function Fieldset({
  focusRequest,
  children,
}: {
  focusRequest: FocusRequest | null;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (!focusRequest || pending) return;
    ref.current?.querySelector<HTMLInputElement>(`[name="${focusRequest.field}"]`)?.focus();
  }, [focusRequest, pending]);

  return (
    <fieldset ref={ref} disabled={pending} className="min-w-0 space-y-5">
      {children}
    </fieldset>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const idle = mode === "sign-in" ? "Sign in" : "Create account";
  const busy = mode === "sign-in" ? "Signing in…" : "Creating account…";
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending && <Spinner />}
      <span>{pending ? busy : idle}</span>
    </button>
  );
}

type FieldProps = {
  defaultValue: string;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
};

function TextField({
  id,
  name,
  label,
  defaultValue,
  error,
  hint,
  onChange,
  onBlur,
  ...input
}: FieldProps & {
  id: string;
  name: Field;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  maxLength?: number;
  inputMode?: "email";
  trailing?: ReactNode;
}) {
  const { trailing, ...rest } = input;
  // The error replaces the hint, so only one is ever referenced.
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          required
          defaultValue={defaultValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`field ${trailing ? "pr-20" : ""}`}
          {...rest}
        />
        {trailing}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-body-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-body-sm text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ mode, ...props }: FieldProps & { mode: Mode }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      id="auth-password"
      name="password"
      label="Password"
      type={visible ? "text" : "password"}
      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls="auth-password"
          className="label-caps absolute inset-y-0 right-0 px-4 text-muted hover:text-ink disabled:cursor-not-allowed"
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      }
      {...props}
    />
  );
}
