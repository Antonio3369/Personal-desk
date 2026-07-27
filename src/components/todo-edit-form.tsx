"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  getTodoEditOptionsAction,
  updateTodoFromFormAction,
} from "@/app/actions/todos";
import { TagPicker } from "@/components/tag-picker";
import type { TodoItem } from "@/components/todo-list";
import {
  TODO_NATURE,
  TODO_PROGRESS,
  type TodoScope,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Option = { id: string; name: string };

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

export function TodoEditForm({
  todo,
  onClose,
}: {
  todo: TodoItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<TodoScope>(
    (todo.scope as TodoScope) || "work",
  );
  const [selectedTags, setSelectedTags] = useState(
    todo.tags?.map(({ tag }) => tag.name) ?? [],
  );
  const [options, setOptions] = useState<{
    cities: Option[];
    contacts: Option[];
    tags: string[];
  } | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodoEditOptionsAction()
      .then(setOptions)
      .finally(() => setLoadingOptions(false));
  }, []);

  function handleSubmit(formData: FormData) {
    const content = String(formData.get("content") ?? "").trim();
    if (!content && !todo.images?.length) {
      setError("请填写内容");
      return;
    }

    setError(null);
    formData.set("scope", scope);
    formData.set("tagNames", JSON.stringify(selectedTags));

    startTransition(async () => {
      try {
        await updateTodoFromFormAction(todo.id, formData);
        onClose();
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "保存失败，请重试",
        );
      }
    });
  }

  return (
    <article className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-stone-900">编辑待办</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loadingOptions ? (
        <p className="text-sm text-stone-500">加载中...</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
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

          <Field label="内容">
            <textarea
              name="content"
              rows={3}
              defaultValue={todo.content}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="进度">
              <select
                name="progress"
                defaultValue={todo.progress}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
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
                defaultValue={
                  todo.followUpDate ? formatDate(todo.followUpDate) : ""
                }
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
          </div>

          {scope === "work" ? (
            <Field label="任务性质">
              <select
                name="nature"
                defaultValue={todo.nature ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
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
                defaultValue={todo.city?.id ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                <option value="">不关联城市</option>
                {options?.cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="关联人脉（可选）">
              <select
                name="contactId"
                defaultValue={todo.contact?.id ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                <option value="">不关联人脉</option>
                {options?.contacts.map((contact) => (
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
              options={options?.tags ?? []}
              selected={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-600"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
