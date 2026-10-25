import type { SessionUser } from "@/lib/session";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

/** Label / value rows between hairlines; stacks on narrow screens. */
export function DetailsList({
  user,
  fields = ["name", "email", "createdAt"],
  className = "",
}: {
  user: SessionUser;
  fields?: ("name" | "email" | "createdAt")[];
  className?: string;
}) {
  const rows = {
    name: { label: "Name", value: user.name },
    email: { label: "Email", value: user.email },
    createdAt: { label: "Member since", value: dateFormat.format(user.createdAt) },
  };

  return (
    <dl className={`hairline-t ${className}`}>
      {fields.map((field) => (
        <div
          key={field}
          className="grid gap-1 hairline-b py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="label-caps text-muted">{rows[field].label}</dt>
          <dd className="break-words">{rows[field].value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-px">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 bg-canvas" />
      ))}
    </div>
  );
}
