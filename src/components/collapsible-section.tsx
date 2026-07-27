"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = false,
  action,
  children,
  bordered = true,
}: {
  title: string;
  description?: string;
  count?: number;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn(bordered && "border-t border-stone-200 pt-6")}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 stroke-[1.5] text-stone-400 transition-transform",
              open && "rotate-180",
            )}
          />
          <div className="min-w-0">
            <h4 className="text-base font-medium text-stone-900">
              {title}
              {typeof count === "number" ? (
                <span className="ml-2 text-sm font-normal text-stone-500">
                  {count}
                </span>
              ) : null}
            </h4>
            {description ? (
              <p className="mt-1 text-sm text-stone-500">{description}</p>
            ) : null}
          </div>
        </button>
        {action ? (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            {action}
          </div>
        ) : null}
      </div>
      {open ? <div className="mt-4 pl-6">{children}</div> : null}
    </div>
  );
}
