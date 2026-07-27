"use client";

import { useState } from "react";
import { RELATION_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RelationTypeField({
  defaultValue = "",
  name = "relationType",
}: {
  defaultValue?: string;
  name?: string;
}) {
  const presets = [...RELATION_TYPES];
  const initial =
    defaultValue && !presets.includes(defaultValue as (typeof RELATION_TYPES)[number])
      ? defaultValue
      : defaultValue;
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setValue(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              value === item
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setValue("")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            !value
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200",
          )}
        >
          不填
        </button>
      </div>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="或自定义，如：上游支付、上级、香港销售"
        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
      />
      <p className="text-xs text-stone-400">
        关系类型可随时修改，不限于上面几个选项。
      </p>
    </div>
  );
}
