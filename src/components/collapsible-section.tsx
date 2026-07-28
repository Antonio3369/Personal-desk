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
  emptyHint,
  variant = "divider",
}: {
  title: string;
  description?: string;
  count?: number;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children?: React.ReactNode;
  bordered?: boolean;
  /** 无内容时的短提示（收起行内 / 展开内容区） */
  emptyHint?: string;
  /** divider：首页/待办用；card：城市/人脉详情用 */
  variant?: "divider" | "card";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasContent = count === undefined ? Boolean(children) : count > 0;

  if (variant === "card") {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded={open}
          >
            <h3 className="text-base font-medium text-stone-900">{title}</h3>
            {typeof count === "number" ? (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                {count}
              </span>
            ) : null}
            {!open && !hasContent && emptyHint ? (
              <span className="truncate text-sm text-stone-400">{emptyHint}</span>
            ) : null}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-stone-400 transition",
                open && "rotate-180",
              )}
            />
          </button>
          {action ? (
            <div
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              {action}
            </div>
          ) : null}
        </div>

        {open ? (
          <div className="border-t border-stone-100 px-4 py-4">
            {hasContent ? (
              children
            ) : (
              <p className="text-sm text-stone-400">
                {emptyHint ?? "暂无内容"}
              </p>
            )}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className={cn(bordered && "border-t border-stone-200 pt-6")}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={open}
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
