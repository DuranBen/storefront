import { Suspense, type ReactNode } from "react";
import { ContentNav, ContentNavLinks, type ContentGroup } from "./content-nav";

/** Title block of an editorial or policy page. */
export function ContentHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
}) {
  return (
    <header>
      {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
      <h1 className="display-sm mt-3">{title}</h1>
      {intro && <p className="mt-5 text-body-lg text-muted">{intro}</p>}
    </header>
  );
}

/** One titled block of copy. Links and lists inside get the house styles. */
export function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="heading">{title}</h2>
      <div className="mt-4 space-y-4 text-muted [&_a]:link [&_strong]:font-medium [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** A standalone content page (careers, stores, appointments): readable width. */
export function ContentPage({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      <div className="container-text section-sm">{children}</div>
    </main>
  );
}

/**
 * Shell for a group of content pages (the house, client services, legal):
 * section navigation beside the page, like the account area.
 */
export function ContentGroupLayout({ group, children }: { group: ContentGroup; children: ReactNode }) {
  return (
    <main className="flex-1">
      <div className="container-page section-sm">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-3">
            <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
              {/* The highlight depends on the URL; the shell shows the links without it. */}
              <Suspense fallback={<ContentNavLinks group={group} pathname={null} />}>
                <ContentNav group={group} />
              </Suspense>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-9 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </main>
  );
}
