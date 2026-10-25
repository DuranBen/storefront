import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailsList, DetailsSkeleton } from "@/components/account/details-list";
import { NameForm } from "@/components/account/name-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account details",
  robots: { index: false },
};

export default function AccountDetailsPage() {
  return (
    <>
      <h2 className="heading">Account details</h2>
      <Suspense fallback={<DetailsPageSkeleton />}>
        <Details />
      </Suspense>
    </>
  );
}

async function Details() {
  const user = await requireUser("/account/details");

  return (
    <>
      <section aria-labelledby="details-name" className="mt-10">
        <h3 id="details-name" className="sr-only">
          Your name
        </h3>
        <NameForm name={user.name} />
      </section>

      <section aria-labelledby="details-sign-in" className="mt-12">
        <h3 id="details-sign-in" className="label-caps">
          Sign-in details
        </h3>
        <DetailsList user={user} fields={["email", "createdAt"]} className="mt-4" />
        <p className="mt-3 text-body-sm text-muted">
          Your email address is used to sign in and can&rsquo;t be changed here yet.
        </p>
      </section>
    </>
  );
}

function DetailsPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your details" className="mt-10 animate-pulse">
      <div className="h-[4.5rem] bg-canvas" />
      <div className="mt-6 h-12 w-40 bg-canvas" />
      <div className="mt-12">
        <DetailsSkeleton rows={2} />
      </div>
    </div>
  );
}
