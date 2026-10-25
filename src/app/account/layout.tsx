import { AccountNav } from "@/components/account/account-nav";

// Static shell for every account page. The session is read in each page,
// inside Suspense, not here: awaiting it in a layout would hold back the
// whole segment (see the Cache Components authentication guide).
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="flex-1">
      <div className="container-page section-sm">
        <h1 className="display-sm">My account</h1>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
              <AccountNav />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-9 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </main>
  );
}
