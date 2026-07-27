"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { deleteTagAction, renameTagAction } from "@/app/actions/tags";

export type TagStat = {
  name: string;
  usageCount: number;
};

export function TagManager({ tags }: { tags: TagStat[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pending, startTransition] = useTransition();

  if (!tags.length) {
    return null;
  }

  function handleDelete(name: string, usageCount: number) {
    const message =
      usageCount > 0
        ? `「${name}」已用在 ${usageCount} 条记录上，删除后会从这些地方移除。确定删除？`
        : `确定删除标签「${name}」？`;

    if (!confirm(message)) return;

    startTransition(async () => {
      await deleteTagAction(name);
      if (searchParams.get("tag") === name) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("tag");
        router.replace(`/notes?${params.toString()}`);
      }
      if (editingName === name) {
        setEditingName(null);
        setDraftName("");
      }
      router.refresh();
    });
  }

  function startEdit(name: string) {
    setEditingName(name);
    setDraftName(name);
  }

  function cancelEdit() {
    setEditingName(null);
    setDraftName("");
  }

  function handleRename(oldName: string) {
    startTransition(async () => {
      const result = await renameTagAction(oldName, draftName);
      if (!result.ok) {
        alert(result.error);
        return;
      }

      if (searchParams.get("tag") === oldName) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tag", result.name);
        router.replace(`/notes?${params.toString()}`);
      }

      setEditingName(null);
      setDraftName("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-medium text-stone-900">标签管理</h3>
          <p className="mt-1 text-sm text-stone-500">
            共 {tags.length} 个标签，可编辑名称或删除不再使用的标签
          </p>
        </div>
        <span className="text-sm text-stone-400">{open ? "收起" : "展开"}</span>
      </button>

      {open ? (
        <div className={`mt-4 space-y-2 ${pending ? "opacity-60" : ""}`}>
          {tags.map((tag) => {
            const isEditing = editingName === tag.name;

            return (
              <div
                key={tag.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-sm text-stone-400">#</span>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleRename(tag.name);
                        }
                        if (event.key === "Escape") {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none ring-stone-900/10 focus:ring-4"
                    />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">#{tag.name}</p>
                    <p className="text-xs text-stone-500">
                      {tag.usageCount > 0
                        ? `用在 ${tag.usageCount} 条记录`
                        : "未使用"}
                    </p>
                  </div>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRename(tag.name)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 transition hover:bg-stone-200"
                      >
                        <Check className="h-3.5 w-3.5" />
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-stone-500 transition hover:bg-stone-200"
                      >
                        <X className="h-3.5 w-3.5" />
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(tag.name)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-stone-500 transition hover:bg-stone-200 hover:text-stone-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.name, tag.usageCount)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
