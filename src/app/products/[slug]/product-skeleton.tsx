/** Placeholder with the product page's layout while URL-specific content streams in. */
export function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="animate-pulse">
      <div className="container-page py-4 lg:py-6">
        <div className="h-4 w-48 bg-canvas" />
      </div>
      <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="-mx-gutter lg:col-span-7 lg:mx-0">
          <div className="aspect-product bg-canvas" />
        </div>
        <div className="space-y-4 lg:col-span-5 lg:max-w-md">
          <div className="h-3 w-24 bg-canvas" />
          <div className="h-9 w-3/4 bg-canvas" />
          <div className="h-5 w-20 bg-canvas" />
          <div className="mt-8 h-12 w-full bg-canvas" />
          <div className="h-12 w-full bg-canvas" />
        </div>
      </div>
    </div>
  );
}
