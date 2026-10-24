import type { ReactNode } from "react";
import { PlusIcon } from "../icons";

/** Hairline-separated expandable section (native <details>, no JS). */
export function Disclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group hairline-b">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 label-caps [&::-webkit-details-marker]:hidden">
        {title}
        <PlusIcon
          width={16}
          height={16}
          className="transition-transform group-open:rotate-45"
        />
      </summary>
      <div className="pb-6 text-body text-muted">{children}</div>
    </details>
  );
}
