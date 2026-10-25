import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminOverview } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

// Signed-out visitors are redirected by src/proxy.ts. getAdminOverview()
// calls requireAdmin(): non-admins get a 404, so nothing here (not even the
// title) renders outside the authorized boundary.
export default function AdminPage() {
  return (
    <main className="flex-1">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminOverview />
      </Suspense>
    </main>
  );
}

async function AdminOverview() {
  const { admin, stats } = await getAdminOverview();

  return (
    <div className="container-page section">
      <p className="eyebrow text-muted">Signed in as {admin.email}</p>
      <h1 className="display-sm mt-3">Admin</h1>

      <dl className="mt-12 grid grid-cols-1 gap-0.5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-canvas p-6 md:p-8">
            <dt className="label-caps text-muted">{stat.label}</dt>
            <dd className="heading mt-3">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div aria-busy="true" className="container-page section animate-pulse">
      <div className="h-3 w-40 bg-canvas" />
      <div className="mt-3 h-10 w-48 bg-canvas" />
      <div className="mt-12 grid grid-cols-1 gap-0.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 bg-canvas" />
        ))}
      </div>
    </div>
  );
}
