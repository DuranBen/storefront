import Link from "next/link";

/** Section title row: eyebrow + serif heading, with an optional "view all" link. */
export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
      <div>
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h2 className="heading mt-2">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="label-caps link shrink-0">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
