"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, Lightbulb, MessageSquare } from "lucide-react";
import { NoteCreateForm } from "@/components/note-forms";
import { NoteList, type NoteItem } from "@/components/note-list";
import { EmptyState } from "@/components/ui-shell";
import { NOTE_TYPES, type NoteType } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

const typeIcons = {
  learning: BookOpen,
  opinion: MessageSquare,
  inspiration: Lightbulb,
};

export function NotesWorkspace({
  notes,
  activeType,
  activeTag,
  activeReadStatus,
  cities,
  contacts,
  tagOptions,
}: {
  notes: NoteItem[];
  activeType: NoteType;
  activeTag?: string;
  activeReadStatus?: string;
  cities: Option[];
  contacts: Option[];
  tagOptions: string[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(type: NoteType, extras?: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    if (extras?.tag) {
      params.set("tag", extras.tag);
    } else {
      params.delete("tag");
    }
    if (extras?.readStatus) {
      params.set("readStatus", extras.readStatus);
    } else {
      params.delete("readStatus");
    }
    return `${pathname}?${params.toString()}`;
  }

  const Icon = typeIcons[activeType];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(NOTE_TYPES) as NoteType[]).map((type) => {
          const active = type === activeType;
          const TabIcon = typeIcons[type];
          return (
            <Link
              key={type}
              href={buildHref(type)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              <TabIcon className="h-4 w-4" />
              {NOTE_TYPES[type]}
            </Link>
          );
        })}
      </div>

      {activeType === "learning" ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            href={buildHref("learning", { readStatus: undefined })}
            active={!activeReadStatus}
            label="全部"
          />
          <FilterChip
            href={buildHref("learning", { readStatus: "unread" })}
            active={activeReadStatus === "unread"}
            label="未读"
          />
          <FilterChip
            href={buildHref("learning", { readStatus: "read" })}
            active={activeReadStatus === "read"}
            label="已读"
          />
          {activeTag ? (
            <FilterChip
              href={buildHref("learning")}
              active
              label={`#${activeTag} ×`}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h3 className="text-base font-medium text-stone-900">
            新建{NOTE_TYPES[activeType]}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {activeType === "learning"
              ? "先贴链接和标签，摘要可以后面再补。"
              : "先记下要点，关联城市和人脉可以后面再补。"}
          </p>
          <div className="mt-4">
            <NoteCreateForm
              type={activeType}
              cities={cities}
              contacts={contacts}
              tagOptions={tagOptions}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-stone-900">
              {NOTE_TYPES[activeType]}列表
            </h3>
            <span className="text-sm text-stone-500">{notes.length} 条</span>
          </div>
          {notes.length ? (
            <NoteList items={notes} tagOptions={tagOptions} />
          ) : (
            <EmptyState
              title={`还没有${NOTE_TYPES[activeType]}记录`}
              description={
                activeType === "learning"
                  ? "收藏公众号、抖音或 YouTube 链接，用标签方便以后查找。"
                  : "把碎片想法记下来，避免散落在各处。"
              }
              icon={Icon}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-stone-900 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200",
      )}
    >
      {label}
    </Link>
  );
}
