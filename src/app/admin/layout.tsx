import { Suspense } from "react";
import { AdminShell, AdminShellSkeleton } from "@/components/admin/admin-shell";

// Unlike the account layout, the admin chrome isn't static: AdminShell checks
// the admin role before rendering anything, so the prerendered shell (served
// to everyone) contains only a neutral skeleton.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<AdminShellSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </main>
  );
}
