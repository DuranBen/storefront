import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { listCategoryOptions } from "@/lib/admin";
import { PRODUCT_FIELDS, type ProductValues } from "@/lib/product-input";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false },
};

const empty = Object.fromEntries(PRODUCT_FIELDS.map((field) => [field, ""])) as ProductValues;

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminSection
        path="/admin/products/new"
        title="New product"
        back={{ href: "/admin/products", label: "All products" }}
      >
        <NewProductForm />
      </AdminSection>
    </Suspense>
  );
}

async function NewProductForm() {
  const categories = await listCategoryOptions();
  return <ProductForm mode="create" initial={empty} categories={categories} />;
}
