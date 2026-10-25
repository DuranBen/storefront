"use client";

import { useActionState, useState } from "react";
import { updateName, type UpdateNameState } from "@/lib/auth-actions";

/**
 * Edit the display name. Posts through a Server Action, so it also works
 * before hydration. "Saved" is announced, and hidden again once the name
 * is edited.
 */
export function NameForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState<UpdateNameState, FormData>(updateName, {
    status: "idle",
  });
  const [dirty, setDirty] = useState(false);

  const value = state.status === "idle" ? name : state.name;
  // A message describes the last submit, so it hides once the field is
  // edited or a new submit is on its way.
  const stale = dirty || pending;
  const error =
    (state.status === "invalid" || state.status === "error") && !stale ? state.message : null;
  const saved = state.status === "saved" && !dirty;

  return (
    <form action={formAction} onSubmit={() => setDirty(false)} noValidate>
      <label htmlFor="account-name" className="label-caps">
        Name
      </label>
      <input
        // Remount after each save so the field shows the stored value.
        key={state.status === "idle" ? "initial" : `${state.status}:${state.name}`}
        id="account-name"
        name="name"
        type="text"
        required
        maxLength={100}
        autoComplete="name"
        defaultValue={value}
        disabled={pending}
        onChange={() => setDirty(true)}
        aria-invalid={(state.status === "invalid" && !stale) || undefined}
        aria-describedby={error ? "account-name-error" : undefined}
        className="field mt-2"
      />
      {error && (
        <p id="account-name-error" role="alert" className="mt-2 text-body-sm text-sale">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <p role="status" className="text-body-sm text-muted">
          {saved ? "Your name has been updated." : ""}
        </p>
      </div>
    </form>
  );
}
