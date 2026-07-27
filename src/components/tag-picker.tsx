"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function TagPicker({
  options,
  selected,
  onChange,
  placeholder = "输入标签，回车添加",
}: {
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const knownTags = useMemo(
    () => Array.from(new Set([...options, ...selected])).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [options, selected],
  );

  const suggestions = useMemo(() => {
    const query = input.trim().replace(/^#/, "").toLowerCase();
    return knownTags.filter((tag) => {
      if (selected.includes(tag)) return false;
      if (!query) return true;
      return tag.toLowerCase().includes(query);
    });
  }, [knownTags, input, selected]);

  function addTag(raw: string) {
    const name = raw.trim().replace(/^#/, "");
    if (!name || selected.includes(name)) {
      setInput("");
      return;
    }
    onChange([...selected, name]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(selected.filter((tag) => tag !== name));
  }

  return (
    <div className="space-y-3">
      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              #{tag}
              <span className="opacity-70">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag(input);
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-stone-900/10 focus:ring-4"
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          className="shrink-0 rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
        >
          添加
        </button>
      </div>

      {suggestions.length ? (
        <div>
          <p className="mb-2 text-xs text-stone-400">
            {knownTags.length ? "已有标签（点击选择）" : "还没有标签，输入后会自动记住"}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 24).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  "bg-stone-100 text-stone-600 hover:bg-stone-200",
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : input.trim() ? (
        <p className="text-xs text-stone-400">
          回车添加新标签「{input.trim().replace(/^#/, "")}」，保存后下次可直接点选
        </p>
      ) : knownTags.length === 0 ? (
        <p className="text-xs text-stone-400">标签由你自己定义，用过一次后会出现在这里</p>
      ) : null}
    </div>
  );
}
