import { redirect } from "next/navigation";
import { Suspense } from "react";
import { safeNext } from "@/lib/safe-next";
import { getCurrentUser } from "@/lib/session";
import { AuthForm } from "./auth-form";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Shared sign-in / sign-up page: static title block, form streamed in. */
export function AuthPage({
  mode,
  title,
  body,
  searchParams,
}: {
  mode: "sign-in" | "sign-up";
  title: string;
  body: string;
  searchParams: SearchParams;
}) {
  return (
    <main className="flex-1">
      <div className="container-text section text-center">
        <h1 className="display-sm">{title}</h1>
        <p className="mt-5 text-body-lg text-muted">{body}</p>
        <div className="text-left">
          {/* The session and ?next= are request data, so they're read in Suspense. */}
          <Suspense fallback={<AuthFormSkeleton fields={mode === "sign-up" ? 3 : 2} />}>
            <AuthFormForVisitor mode={mode} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function AuthFormForVisitor({
  mode,
  searchParams,
}: {
  mode: "sign-in" | "sign-up";
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;

  // Already signed in: skip the form.
  if (await getCurrentUser()) redirect(safeNext(nextPath));

  return <AuthForm mode={mode} next={nextPath} />;
}

/** Same footprint as the form (label + field per input, then the button). */
function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-busy="true" className="mx-auto mt-10 max-w-sm animate-pulse space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="h-[4.5rem] bg-canvas" />
      ))}
      <div className="h-12 bg-canvas" />
    </div>
  );
}
