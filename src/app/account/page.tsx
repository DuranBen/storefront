import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailsList, DetailsSkeleton } from "@/components/account/details-list";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

// Signed-out visitors are redirected by src/proxy.ts; requireUser() is the
// real check (against the database), inside Suspense as Cache Components needs.
export default function AccountOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser("/account");
  const firstName = user.name.split(/\s+/)[0];

  return (
    <>
      <h2 className="heading">Welcome back, {firstName}</h2>
      <p className="mt-3 text-body-lg text-muted">
        Review and update the details on your Atelier account.
      </p>

      <section aria-labelledby="overview-details" className="mt-10">
        <div className="flex items-baseline justify-between gap-6">
          <h3 id="overview-details" className="label-caps">
            Your details
          </h3>
          <Link href="/account/details" className="label-caps link shrink-0">
            Edit
          </Link>
        </div>
        <DetailsList user={user} className="mt-4" />
      </section>

      <Link href="/" className="btn btn-secondary mt-10 w-full sm:w-auto">
        Continue shopping
      </Link>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your account" className="animate-pulse">
      <div className="h-9 w-64 max-w-full bg-canvas" />
      <div className="mt-4 h-5 w-80 max-w-full bg-canvas" />
      <div className="mt-10">
        <DetailsSkeleton />
      </div>
    </div>
  );
}
