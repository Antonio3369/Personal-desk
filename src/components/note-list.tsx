"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Sparkles, Trash2, X } from "lucide-react";
import {
  deleteNoteAction,
  generateNoteSummaryAction,
  toggleNoteReadAction,
  updateNoteFromFormAction,
} from "@/app/actions/notes";
import { AttachmentImageGallery } from "@/components/attachment-image-gallery";
import { ImageUploadField } from "@/components/image-upload-field";
import { TagPicker } from "@/components/tag-picker";
import { uploadImagesFromForm, formDataForServerAction } from "@/lib/upload-images-client";
import {
  NOTE_PLATFORMS,
  NOTE_TYPES,
  READ_STATUS,
  type NoteType,
} from "@/lib/constants";
import { Badge } from "@/components/ui-shell";
import { formatDate } from "@/lib/utils";
import { hasNoteSummarySource } from "@/lib/note-summary-source";

export type NoteItem = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  link: string | null;
  platform: string | null;
  highlight: string | null;
  summary: string | null;
  readStatus: string;
  city?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  tags?: { tag: { name: string } }[];
  images?: { id: string; path: string }[];
  updatedAt: Date | string;
};

export function NoteList({
  items,
  editable = true,
  tagOptions = [],
}: {
  items: NoteItem[];
  editable?: boolean;
  tagOptions?: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          editable={editable}
          tagOptions={tagOptions}
        />
      ))}
    </div>
  );
}

function NoteCard({
  note,
  editable,
  tagOptions,
}: {
  note: NoteItem;
  editable: boolean;
  tagOptions: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generating, startGenerate] = useTransition();
  const [editing, setEditing] = useState(false);
  const isLearning = note.type === "learning";
  const isRead = note.readStatus === "read";
  const canSummarize = hasNoteSummarySource(note);
  const title =
    note.title ||
    note.highlight ||
    (isLearning ? note.link : null) ||
    "无标题";

  function handleDelete() {
    if (!confirm("确定删除这条笔记？")) return;
    startTransition(async () => {
      await deleteNoteAction(note.id);
      router.refresh();
    });
  }

  function handleToggleRead() {
    startTransition(async () => {
      await toggleNoteReadAction(note.id, !isRead);
      router.refresh();
    });
  }

  function handleGenerateSummary() {
    if (note.summary && !confirm("已有摘要，要重新生成吗？")) {
      return;
    }

    startGenerate(async () => {
      try {
        await generateNoteSummaryAction(note.id);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "生成摘要失败");
      }
    });
  }

  if (editing && editable) {
    return (
      <NoteEditForm
        note={note}
        tagOptions={tagOptions}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        pending || generating ? "opacity-60" : ""
      } ${isLearning && !isRead ? "border-stone-300" : "border-stone-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{NOTE_TYPES[note.type as NoteType]}</Badge>
            {isLearning && note.platform ? (
              <Badge>
                {NOTE_PLATFORMS[note.platform as keyof typeof NOTE_PLATFORMS] ??
                  note.platform}
              </Badge>
            ) : null}
            {isLearning ? (
              <Badge tone={isRead ? "success" : "warning"}>
                {READ_STATUS[note.readStatus as keyof typeof READ_STATUS]}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-2 font-medium text-stone-900">{title}</h3>
        </div>
        {editable ? (
          <div className="flex shrink-0 items-center gap-1">
            {canSummarize ? (
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={generating}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-teal-800 hover:bg-teal-50 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generating ? "生成中…" : note.summary ? "重新摘要" : "AI 摘要"}
              </button>
            ) : null}
            {isLearning ? (
              <button
                type="button"
                onClick={handleToggleRead}
                className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100"
              >
                {isRead ? "标未读" : "标已读"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {note.link ? (
        <a
          href={note.link}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="truncate">{note.link}</span>
        </a>
      ) : null}

      {note.highlight ? (
        <p className="mt-3 text-sm leading-7 text-stone-600">{note.highlight}</p>
      ) : null}

      {note.summary ? (
        <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-3">
          <p className="text-xs font-medium text-teal-800">摘要</p>
          <p className="mt-1 text-sm leading-7 text-stone-600 whitespace-pre-wrap">
            {note.summary}
          </p>
        </div>
      ) : null}

      {note.content ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
          {note.content}
        </p>
      ) : null}

      {note.images?.length ? (
        <AttachmentImageGallery images={note.images} compact />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {note.tags?.map(({ tag }) => (
          <Link
            key={tag.name}
            href={`/notes?type=${note.type}&tag=${encodeURIComponent(tag.name)}`}
            className="text-xs text-stone-500 hover:text-stone-900"
          >
            #{tag.name}
          </Link>
        ))}
        {note.city ? <Badge>{note.city.name}</Badge> : null}
        {note.contact ? (
          <Link href={`/contacts/${note.contact.id}`}>
            <Badge tone="muted">{note.contact.name}</Badge>
          </Link>
        ) : null}
        <span className="text-xs text-stone-400">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </article>
  );
}

function NoteEditForm({
  note,
  tagOptions,
  onClose,
}: {
  note: NoteItem;
  tagOptions: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState(
    note.tags?.map(({ tag }) => tag.name) ?? [],
  );
  const isLearning = note.type === "learning";

  function handleSubmit(formData: FormData) {
    formData.set("tagNames", JSON.stringify(selectedTags));

    startTransition(async () => {
      try {
        const imagePaths = await uploadImagesFromForm("notes", formData);
        const actionData = formDataForServerAction(formData);
        actionData.set("imagePaths", JSON.stringify(imagePaths));
        await updateNoteFromFormAction(note.id, actionData);
        onClose();
        router.refresh();
      } catch (submitError) {
        console.error(submitError);
      }
    });
  }

  return (
    <article className="rounded-2xl border border-stone-300 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-stone-900">编辑笔记</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(new FormData(event.currentTarget));
        }}
        className="space-y-4"
      >
        {isLearning ? (
          <>
            <Field label="链接">
              <input
                name="link"
                defaultValue={note.link ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="标题">
              <input
                name="title"
                defaultValue={note.title ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="平台">
              <select
                name="platform"
                defaultValue={note.platform ?? "other"}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                {Object.entries(NOTE_PLATFORMS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="亮点">
              <textarea
                name="highlight"
                rows={2}
                defaultValue={note.highlight ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="摘要">
              <textarea
                name="summary"
                rows={3}
                defaultValue={note.summary ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="阅读状态">
              <select
                name="readStatus"
                defaultValue={note.readStatus}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                {Object.entries(READ_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <Field label="标题">
              <input
                name="title"
                defaultValue={note.title ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="内容">
              <textarea
                name="content"
                rows={5}
                defaultValue={note.content ?? ""}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
          </>
        )}

        {note.images?.length ? (
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">已有附图</p>
            <AttachmentImageGallery images={note.images} compact />
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            添加附图
          </label>
          <ImageUploadField />
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
