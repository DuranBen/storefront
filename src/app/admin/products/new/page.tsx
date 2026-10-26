import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { ArrowLeftIcon } from "@/components/icons";
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
      <BackLink />
      <AdminSection path="/admin/products/new" title="New product">
        <NewProductForm />
      </AdminSection>
    </Suspense>
  );
}

async function NewProductForm() {
  const categories = await listCategoryOptions();
  return <ProductForm mode="create" initial={empty} categories={categories} />;
}

function BackLink() {
  return (
    <Link
      href="/admin/products"
      className="label-caps link-quiet mb-6 inline-flex items-center gap-2"
    >
      <ArrowLeftIcon width={16} height={16} />
      All products
    </Link>
  );
}
