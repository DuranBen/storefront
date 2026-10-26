import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

// AdminSection calls requireAdmin() itself: the layout's check alone doesn't
// cover client-side navigation between admin pages.
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminSection path="/admin/orders" title="Orders">
        <div className="mt-10 bg-canvas p-8 text-center md:p-12">
          <p className="text-body-lg">See customer orders, their items and payment status.</p>
          <p className="mt-2 text-body-sm text-muted">This section is coming next.</p>
        </div>
      </AdminSection>
    </Suspense>
  );
}
