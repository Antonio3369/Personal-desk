"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { updateContactAction } from "@/app/actions/contacts";
import { RelationTypeField } from "@/components/relation-type-field";
import { NoteList } from "@/components/note-list";
import { Badge } from "@/components/ui-shell";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
  relationType: string | null;
  cityId: string | null;
  city: { id: string; name: string } | null;
  notes: string | null;
  interactionSummary: string | null;
  _count: { todos: number; notes_rel: number };
  notes_rel: Array<{
    id: string;
    type: string;
    title: string | null;
    content: string | null;
    link: string | null;
    platform: string | null;
    highlight: string | null;
    summary: string | null;
    readStatus: string;
    updatedAt: Date | string;
    tags?: { tag: { name: string } }[];
    city?: { id: string; name: string } | null;
    contact?: { id: string; name: string } | null;
  }>;
};

type CityOption = { id: string; name: string };

export function ContactCard({
  contact,
  cities,
}: {
  contact: Contact;
  cities: CityOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      await updateContactAction(contact.id, {
        name: String(formData.get("name") ?? ""),
        role: String(formData.get("role") ?? "") || null,
        organization: String(formData.get("organization") ?? "") || null,
        relationType: String(formData.get("relationType") ?? "") || null,
        cityId: String(formData.get("cityId") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
        interactionSummary:
          String(formData.get("interactionSummary") ?? "") || null,
      });
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <article className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-stone-900">编辑人脉</h3>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={handleUpdate} className="space-y-4">
          <Field label="姓名">
            <input
              name="name"
              required
              defaultValue={contact.name}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="角色">
              <input
                name="role"
                defaultValue={contact.role ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="城市/组织">
              <input
                name="organization"
                defaultValue={contact.organization ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
          </div>
          <Field label="关系类型">
            <RelationTypeField defaultValue={contact.relationType ?? ""} />
          </Field>
          <Field label="所属城市">
            <select
              name="cityId"
              defaultValue={contact.cityId ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              <option value="">不指定</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="互动摘要">
            <textarea
              name="interactionSummary"
              rows={3}
              defaultValue={contact.interactionSummary ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="备注">
            <textarea
              name="notes"
              rows={3}
              defaultValue={contact.notes ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "保存中..." : "保存修改"}
          </button>
        </form>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-medium text-stone-900">{contact.name}</h3>
          {contact.relationType ? (
            <Badge tone="muted">{contact.relationType}</Badge>
          ) : null}
          {contact.city ? <Badge>{contact.city.name}</Badge> : null}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="编辑"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      {contact.role || contact.organization ? (
        <p className="mt-2 text-sm text-stone-500">
          {[contact.role, contact.organization].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {contact.interactionSummary ? (
        <p className="mt-3 text-sm leading-7 text-stone-600">
          {contact.interactionSummary}
        </p>
      ) : null}
      {contact.notes ? (
        <p className="mt-3 text-sm leading-7 text-stone-500">{contact.notes}</p>
      ) : null}
      {contact.notes_rel.length ? (
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              相关笔记
            </p>
            <Link href="/notes" className="text-xs text-stone-500">
              全部
            </Link>
          </div>
          <NoteList items={contact.notes_rel} editable={false} />
        </div>
      ) : null}
      <p className="mt-4 text-xs text-stone-400">
        关联待办 {contact._count.todos} 条
        {contact._count.notes_rel
          ? ` · 笔记 ${contact._count.notes_rel} 条`
          : ""}
      </p>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
    </div>
  );
}
