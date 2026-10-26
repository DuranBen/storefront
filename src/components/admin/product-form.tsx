"use client";

import Image from "next/image";
import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createProduct, updateProduct, type ProductFormState } from "@/lib/admin-actions";
import { unsplash } from "@/lib/catalog";
import { slugify, type ProductField, type ProductValues } from "@/lib/product-input";
import { Spinner } from "../spinner";

const UNSPLASH_ID = /^\d{10,13}-[0-9a-f]{12}$/;

/**
 * Create or edit a product. Validation happens on the server (createProduct /
 * updateProduct); errors come back per field. Fields are uncontrolled and
 * re-filled from what was submitted, since React resets a form after its
 * action runs.
 */
export function ProductForm({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  productId?: number;
  initial: ProductValues;
  categories: { id: number; name: string }[];
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    mode === "create" ? createProduct : updateProduct,
    { status: "idle" },
  );
  const values = state.status === "idle" ? initial : state.values;
  const errors = state.status === "invalid" ? state.errors : {};

  // After each action React resets the form to its default values, but a
  // <select> keeps the default it was first rendered with. Remounting the
  // fields once a result arrives (not on submit, while the old values are
  // still in state) re-renders every field from what was just submitted.
  const [seenState, setSeenState] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== seenState) {
    setSeenState(state);
    setVersion((v) => v + 1);
  }

  // Create mode: the URL name follows the name until it's edited by hand.
  const [slug, setSlug] = useState(values.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [imageId, setImageId] = useState(values.imageId);

  const field = (name: ProductField) => ({
    id: `product-${name}`,
    name,
    defaultValue: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `product-${name}-error` : undefined,
  });

  return (
    <form action={formAction} noValidate className="mt-8">
      {productId && <input type="hidden" name="id" value={productId} />}

      <div key={version} className="space-y-10">
        <Fieldset legend="Basics">
          <Field label="Name" name="name" error={errors.name}>
            <input
              {...field("name")}
              type="text"
              maxLength={120}
              className="field"
              onChange={(e) => {
                if (mode === "create" && !slugEdited) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          {mode === "create" ? (
            <Field
              label="URL name"
              name="slug"
              error={errors.slug}
              hint={`The product's address: /products/${slug || "…"}. It can't be changed later.`}
            >
              <input
                {...field("slug")}
                defaultValue={undefined}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                type="text"
                maxLength={100}
                className="field"
              />
            </Field>
          ) : (
            <p className="text-body-sm text-muted">
              Address: <span className="text-ink">/products/{values.slug}</span> (fixed)
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" name="categoryId" error={errors.categoryId}>
              <select {...field("categoryId")} className="field">
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (USD)" name="price" error={errors.price} hint="Whole dollars.">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
                  $
                </span>
                <input {...field("price")} type="text" inputMode="numeric" className="field pl-8" />
              </div>
            </Field>
            <Field label="Colour" name="colour" error={errors.colour}>
              <input {...field("colour")} type="text" maxLength={40} className="field" />
            </Field>
            <Field label="Badge" name="badge" error={errors.badge} hint="Optional, e.g. New.">
              <input {...field("badge")} type="text" maxLength={30} className="field" />
            </Field>
          </div>
        </Fieldset>

        <Fieldset legend="Description">
          <Field label="Description" name="description" error={errors.description}>
            <textarea {...field("description")} rows={4} maxLength={2000} className="field" />
          </Field>
          <Field label="Details" name="details" error={errors.details} hint="One per line.">
            <textarea {...field("details")} rows={4} className="field" />
          </Field>
          <Field label="Made in" name="madeIn" error={errors.madeIn}>
            <input {...field("madeIn")} type="text" maxLength={60} className="field" />
          </Field>
        </Fieldset>

        <Fieldset legend="Image">
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="space-y-6">
              <Field
                label="Unsplash photo id"
                name="imageId"
                error={errors.imageId}
                hint="From the photo's URL, e.g. 1560343090-f0409e92791a."
              >
                <input
                  {...field("imageId")}
                  type="text"
                  className="field"
                  onChange={(e) => setImageId(e.target.value.trim())}
                />
              </Field>
              <Field label="Image description" name="imageAlt" error={errors.imageAlt}>
                <input {...field("imageAlt")} type="text" maxLength={200} className="field" />
              </Field>
              <Field
                label="Focus position"
                name="imagePosition"
                error={errors.imagePosition}
                hint="Optional, e.g. 50% 30%."
              >
                <input {...field("imagePosition")} type="text" className="field" />
              </Field>
            </div>
            <div className="media-product w-32 sm:w-auto" aria-hidden="true">
              {UNSPLASH_ID.test(imageId) ? (
                <Image src={unsplash(imageId, 400)} alt="" fill sizes="8rem" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-body-sm text-muted">
                  Preview
                </span>
              )}
            </div>
          </div>
        </Fieldset>

        {mode === "create" && (
          <Fieldset legend="Sizes">
            <Field
              label="Sizes"
              name="sizes"
              error={errors.sizes}
              hint="Comma-separated, e.g. XS, S, M, L. Leave empty for a one-size product. Stock starts at 0; set it after creating."
            >
              <input {...field("sizes")} type="text" className="field" />
            </Field>
          </Fieldset>
        )}
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-8 text-body-sm text-sale">
          {state.message}
        </p>
      )}
      {state.status === "invalid" && (
        <p role="alert" className="mt-8 text-body-sm text-sale">
          Please correct the highlighted fields.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton label={mode === "create" ? "Create product" : "Save changes"} />
        <p role="status" className="text-body-sm text-muted">
          {state.status === "saved" ? "Saved. The store shows the changes now." : ""}
        </p>
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
      {pending && <Spinner />}
      {pending ? "Saving…" : label}
    </button>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-6">
      <legend className="label-caps mb-4 w-full hairline-b pb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: ProductField;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={`product-${name}`} className="label-caps text-muted">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`product-${name}-error`} className="mt-2 text-body-sm text-sale">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-body-sm text-muted">{hint}</p>
      )}
    </div>
  );
}
