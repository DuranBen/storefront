import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false },
};

/** /admin has no page of its own: admins go to Products. */
export default function AdminIndexPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminIndex />
    </Suspense>
  );
}

// Checked before redirecting, so non-admins get a 404 rather than a redirect
// that reveals where the admin sections are.
async function AdminIndex(): Promise<null> {
  await requireAdmin();
  redirect("/admin/products");
}
