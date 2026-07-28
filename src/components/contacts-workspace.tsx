"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { ContactCard } from "@/components/contact-card";
import { ContactForm } from "@/components/forms";

export type ContactListItem = {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
  relationType: string | null;
  interactionSummary: string | null;
  city: { id: string; name: string } | null;
  _count: { todos: number; notes_rel: number };
};

type CityOption = { id: string; name: string };

type CityGroup = {
  key: string;
  cityId: string | null;
  cityName: string;
  contacts: ContactListItem[];
};

function matchesQuery(contact: ContactListItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    contact.name,
    contact.role,
    contact.organization,
    contact.relationType,
    contact.interactionSummary,
    contact.city?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function groupByCity(contacts: ContactListItem[]): CityGroup[] {
  const map = new Map<string, CityGroup>();

  for (const contact of contacts) {
    const key = contact.city?.id ?? "__none__";
    const existing = map.get(key);
    if (existing) {
      existing.contacts.push(contact);
    } else {
      map.set(key, {
        key,
        cityId: contact.city?.id ?? null,
        cityName: contact.city?.name ?? "未关联城市",
        contacts: [contact],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.cityId === null) return 1;
    if (b.cityId === null) return -1;
    return a.cityName.localeCompare(b.cityName, "zh-CN");
  });
}

const PREVIEW_PER_CITY = 2;

function CityContactGroup({
  group,
  forceExpanded,
}: {
  group: CityGroup;
  forceExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const showAll = forceExpanded || expanded;
  const visible = showAll
    ? group.contacts
    : group.contacts.slice(0, PREVIEW_PER_CITY);
  const hiddenCount = Math.max(0, group.contacts.length - PREVIEW_PER_CITY);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-baseline gap-2">
          {group.cityId ? (
            <Link
              href={`/cities/${group.cityId}`}
              className="truncate text-sm font-medium text-stone-900 hover:text-teal-900"
            >
              {group.cityName}
            </Link>
          ) : (
            <h3 className="text-sm font-medium text-stone-500">
              {group.cityName}
            </h3>
          )}
          <span className="shrink-0 text-xs text-stone-400">
            {group.contacts.length}
          </span>
        </div>
        {group.cityId ? (
          <Link
            href={`/cities/${group.cityId}`}
            className="shrink-0 text-xs text-stone-400 hover:text-stone-700"
          >
            城市简报
          </Link>
        ) : null}
      </div>
      <div className="space-y-3">
        {visible.map((contact) => (
          <ContactCard key={contact.id} contact={contact} hideCity />
        ))}
        {!forceExpanded && hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="w-full rounded-2xl border border-dashed border-stone-200 px-3 py-2.5 text-sm text-stone-500 transition hover:bg-stone-50"
          >
            {expanded ? "收起" : `还有 ${hiddenCount} 人`}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ContactsWorkspace({
  contacts,
  cities,
}: {
  contacts: ContactListItem[];
  cities: CityOption[];
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(contacts.length === 0);

  const filtered = useMemo(
    () => contacts.filter((contact) => matchesQuery(contact, query)),
    [contacts, query],
  );
  const groups = useMemo(() => groupByCity(filtered), [filtered]);
  const trimmed = query.trim();
  const searching = Boolean(trimmed);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            人脉馆
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            按城市找人，搜索定位；见面或来电前点进详情看一眼。
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-start">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">搜索人脉</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索姓名、角色、组织、城市…"
              className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-stone-900/10 placeholder:text-stone-400 focus:ring-4"
            />
            {searching ? (
              <p
                className={`mt-1.5 text-xs ${
                  filtered.length ? "text-teal-900" : "text-stone-400"
                }`}
              >
                {filtered.length
                  ? `找到 ${filtered.length} 人`
                  : "无匹配结果"}
              </p>
            ) : null}
          </label>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              添加人脉
            </button>
          ) : null}
        </div>
      </div>

      {adding ? (
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-medium text-stone-900">添加人脉</h3>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="收起添加表单"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ContactForm cities={cities} />
        </section>
      ) : null}

      {!contacts.length ? (
        adding ? null : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center text-sm text-stone-500">
            还没有人脉记录。点「添加人脉」开始。
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
          没有匹配「{trimmed}」的人脉
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <CityContactGroup
              key={group.key}
              group={group}
              forceExpanded={searching}
            />
          ))}
        </div>
      )}
    </div>
  );
}
