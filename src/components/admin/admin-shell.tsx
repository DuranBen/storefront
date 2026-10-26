import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/session";
import { AdminNav, AdminNavLinks } from "./admin-nav";

/**
 * The admin chrome (title and navigation), rendered only after the server
 * has confirmed the admin role. Non-admins get the not-found page and never
 * receive the admin title or navigation, not even in the prerendered shell:
 * the layout's Suspense fallback is AdminShellSkeleton, which has no admin
 * wording.
 *
 * This is one of three checks: src/proxy.ts redirects signed-out visitors,
 * and every admin page calls requireAdmin() again itself, because layouts
 * don't re-render on client-side navigation between sibling pages.
 */
export async function AdminShell({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="container-page section-sm">
      <h1 className="display-sm">Admin</h1>
      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
            <Suspense fallback={<AdminNavLinks />}>
              <AdminNav />
            </Suspense>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}

/** Neutral placeholder: no admin wording, since anyone may be served it. */
export function AdminShellSkeleton() {
  return (
    <div aria-busy="true" className="container-page section-sm animate-pulse">
      <div className="h-10 w-48 bg-canvas" />
      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-3 lg:col-span-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-24 bg-canvas" />
          ))}
        </div>
        <div className="h-64 bg-canvas lg:col-span-9" />
      </div>
    </div>
  );
}

/**
 * A section's heading and content, gated by its own requireAdmin() call.
 * Each admin page renders this inside <Suspense>.
 */
export async function AdminSection({
  path,
  title,
  actions,
  children,
}: {
  path: string;
  title: string;
  /** Shown beside the heading, e.g. a "New product" link. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  await requireAdmin(path);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="heading">{title}</h2>
        {actions}
      </div>
      {children}
    </>
  );
}

export function AdminSectionSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <div className="h-9 w-40 bg-canvas" />
      <div className="mt-10 h-48 bg-canvas" />
    </div>
  );
}
