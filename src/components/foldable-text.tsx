"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FoldableText({
  text,
  lines = 2,
  className,
}: {
  text: string;
  lines?: 2 | 3;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsFold = text.length > 80 || text.split("\n").length > lines;

  return (
    <div className="min-w-0">
      <p
        className={cn(
          "break-words text-sm leading-6 text-stone-700",
          !expanded && needsFold && (lines === 3 ? "line-clamp-3" : "line-clamp-2"),
          className,
        )}
      >
        {text}
      </p>
      {needsFold ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs text-stone-500 hover:text-stone-800"
        >
          {expanded ? "收起" : "展开全文"}
        </button>
      ) : null}
    </div>
  );
}
