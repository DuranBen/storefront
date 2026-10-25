import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/lib/auth-actions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

// Signed-out visitors are redirected by src/proxy.ts; requireUser() is the
// real check (against the database), inside Suspense as Cache Components needs.
export default function AccountPage() {
  return (
    <main className="flex-1">
      <div className="container-text section">
        <p className="eyebrow text-center text-muted">Atelier</p>
        <h1 className="display-sm mt-3 text-center">My account</h1>
        <Suspense fallback={<AccountSkeleton />}>
          <AccountDetails />
        </Suspense>
      </div>
    </main>
  );
}

async function AccountDetails() {
  const user = await requireUser("/account");

  return (
    <div className="mx-auto mt-12 max-w-md">
      <dl className="hairline-t">
        {[
          ["Name", user.name],
          ["Email", user.email],
          ["Member since", dateFormat.format(user.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 hairline-b py-4">
            <dt className="label-caps text-muted">{label}</dt>
            <dd className="min-w-0 text-right break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <form action={signOut} className="mt-10">
        <button type="submit" className="btn btn-secondary w-full">
          Sign out
        </button>
      </form>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto mt-12 max-w-md animate-pulse space-y-4">
      <div className="h-8 bg-canvas" />
      <div className="h-8 bg-canvas" />
      <div className="h-8 bg-canvas" />
      <div className="mt-10 h-12 bg-canvas" />
    </div>
  );
}
