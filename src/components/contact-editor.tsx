"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updateContactAction } from "@/app/actions/contacts";
import { RelationTypeField } from "@/components/relation-type-field";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
  relationType: string | null;
  cityId: string | null;
  notes: string | null;
  interactionSummary: string | null;
};

type CityOption = { id: string; name: string };

export function ContactEditor({
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

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50"
      >
        <Pencil className="h-4 w-4" />
        编辑档案
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-stone-900">编辑档案</h3>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
          aria-label="取消编辑"
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
          <Field label="组织">
            <input
              name="organization"
              defaultValue={contact.organization ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <Field label="上次接点">
          <textarea
            name="interactionSummary"
            rows={3}
            placeholder="上次聊了什么、对方态度如何"
            defaultValue={contact.interactionSummary ?? ""}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="见面注意">
          <textarea
            name="notes"
            rows={3}
            placeholder="雷区、偏好、见面前提醒自己的话"
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
    </section>
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
