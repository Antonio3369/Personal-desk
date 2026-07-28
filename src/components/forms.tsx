"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageUploadField, getImageFilesFromFormData } from "@/components/image-upload-field";
import { RelationTypeField } from "@/components/relation-type-field";
import { TagPicker } from "@/components/tag-picker";
import { createTodoFromFormAction } from "@/app/actions/todos";
import { uploadImagesFromForm, formDataForServerAction } from "@/lib/upload-images-client";
import {
  TODO_NATURE,
  TODO_PROGRESS,
  type TodoScope,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Option = { id: string; name: string };

export function QuickCaptureForm({
  defaultScope = "work",
  cities = [],
  contacts = [],
  tagOptions = [],
}: {
  defaultScope?: TodoScope;
  cities?: Option[];
  contacts?: Option[];
  tagOptions?: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<TodoScope>(defaultScope);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const content = String(formData.get("content") ?? "").trim();
    const imageFiles = getImageFilesFromFormData(formData);
    if (!content && !imageFiles.length) {
      setError("请填写内容或添加图片");
      return;
    }

    setError(null);
    formData.set("scope", scope);
    formData.set("tagNames", JSON.stringify(selectedTags));

    startTransition(async () => {
      try {
        const imagePaths = await uploadImagesFromForm("todos", formData);
        const actionData = formDataForServerAction(formData);
        actionData.set("imagePaths", JSON.stringify(imagePaths));
        await createTodoFromFormAction(actionData);
        router.push(
          scope === "personal" ? "/todos?view=personal" : "/todos?view=active",
        );
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "保存失败，请重试",
        );
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
        {(["work", "personal"] as TodoScope[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              scope === value
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500"
            }`}
          >
            {value === "work" ? "工作待办" : "个人事务"}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          内容
        </label>
        <textarea
          name="content"
          rows={4}
          placeholder={
            scope === "work"
              ? "例如：跟进香港支付公司功能需求（说不清时可只附图）"
              : "例如：预约体检（说不清时可只附图）"
          }
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          附图
        </label>
        <ImageUploadField />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="进度">
          <select
            name="progress"
            defaultValue="not_started"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            {Object.entries(TODO_PROGRESS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="下次跟进">
          <input
            type="date"
            name="followUpDate"
            defaultValue={formatDate(new Date())}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          />
        </Field>
      </div>

      {scope === "work" ? (
        <Field label="任务性质">
          <select
            name="nature"
            defaultValue=""
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">未指定</option>
            {Object.entries(TODO_NATURE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="关联城市（可选）">
          <select
            name="cityId"
            defaultValue=""
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">不关联城市</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="关联人脉（可选）">
          <select
            name="contactId"
            defaultValue=""
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">不关联人脉</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          标签
        </label>
        <TagPicker
          options={tagOptions}
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存"}
      </button>
    </form>
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

export function ContactForm({
  cities = [],
}: {
  cities?: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const { createContactAction } = await import("@/app/actions/contacts");
      const contact = await createContactAction({
        name: String(formData.get("name") ?? ""),
        role: String(formData.get("role") ?? "") || null,
        organization: String(formData.get("organization") ?? "") || null,
        relationType: String(formData.get("relationType") ?? "") || null,
        cityId: String(formData.get("cityId") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
        interactionSummary:
          String(formData.get("interactionSummary") ?? "") || null,
      });
      router.push(`/contacts/${contact.id}`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="姓名">
        <input
          name="name"
          required
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="角色">
          <input
            name="role"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="组织">
          <input
            name="organization"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="关系类型">
          <RelationTypeField />
        </Field>
        <Field label="所属城市">
          <select
            name="cityId"
            defaultValue=""
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
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="见面注意">
        <textarea
          name="notes"
          rows={3}
          placeholder="雷区、偏好、见面前提醒自己的话"
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
      >
        {pending ? "保存中..." : "添加人脉"}
      </button>
    </form>
  );
}
