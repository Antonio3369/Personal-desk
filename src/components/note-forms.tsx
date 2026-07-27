"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createNoteAction } from "@/app/actions/notes";
import { TagPicker } from "@/components/tag-picker";
import {
  NOTE_PLATFORMS,
  NOTE_TYPES,
  detectPlatformFromUrl,
  type NoteType,
} from "@/lib/constants";
import { isLikelyShareText, normalizeLearningLink } from "@/lib/link-utils";

type Option = { id: string; name: string };

export function NoteCreateForm({
  type,
  cities = [],
  contacts = [],
  tagOptions = [],
  compact = false,
  onSuccess,
}: {
  type: NoteType;
  cities?: Option[];
  contacts?: Option[];
  tagOptions?: string[];
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>("other");
  const [linkInput, setLinkInput] = useState("");
  const [linkHint, setLinkHint] = useState<string | null>(null);

  const tags = tagOptions;

  function applyLinkInput(value: string) {
    setLinkInput(value);
    const normalized = normalizeLearningLink(value);
    if (normalized) {
      setPlatform(normalized.platform);
      setLinkHint(
        normalized.link !== value.trim()
          ? `已识别为：${normalized.link}`
          : null,
      );
      return;
    }
    if (value.trim()) {
      setPlatform(detectPlatformFromUrl(value));
      setLinkHint(
        isLikelyShareText(value)
          ? "未能完整识别链接，保存时会再尝试解析"
          : null,
      );
    } else {
      setLinkHint(null);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const rawLink = String(formData.get("link") ?? "");
      const normalized = normalizeLearningLink(rawLink);
      if (type === "learning" && !normalized) {
        alert("请粘贴有效链接，或完整的抖音/公众号分享文案。");
        return;
      }

      await createNoteAction({
        type,
        title: String(formData.get("title") ?? "") || null,
        content: String(formData.get("content") ?? "") || null,
        link: normalized?.link ?? (rawLink.trim() || null),
        platform:
          type === "learning"
            ? (String(formData.get("platform") ?? platform) as
                | "wechat"
                | "douyin"
                | "youtube"
                | "book"
                | "course"
                | "other")
            : null,
        highlight: String(formData.get("highlight") ?? "") || null,
        summary: String(formData.get("summary") ?? "") || null,
        cityId: String(formData.get("cityId") ?? "") || null,
        contactId: String(formData.get("contactId") ?? "") || null,
        tagNames: selectedTags,
      });
      setSelectedTags([]);
      setLinkInput("");
      setLinkHint(null);
      onSuccess?.();
      router.refresh();
      if (compact) {
        router.push(`/notes?type=${type}`);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-4"
    >
      {type === "learning" ? (
        <>
          <Field label="链接" required>
            <input
              name="link"
              required
              type="text"
              value={linkInput}
              placeholder="粘贴链接，或抖音/公众号整段分享文案"
              onChange={(event) => applyLinkInput(event.target.value)}
              onPaste={(event) => {
                event.preventDefault();
                applyLinkInput(event.clipboardData.getData("text"));
              }}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
            {linkHint ? (
              <p className="mt-2 text-xs leading-5 text-emerald-700">{linkHint}</p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-stone-400">
                支持直接粘贴抖音分享口令，会自动提取 v.douyin.com 链接
              </p>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="标题（可选）">
              <input
                name="title"
                placeholder="自动或手填"
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="来源平台">
              <select
                name="platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                {Object.entries(NOTE_PLATFORMS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="一句话亮点（可选）">
            <textarea
              name="highlight"
              rows={2}
              placeholder="当时为什么想收藏"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
          {!compact ? (
            <Field label="摘要（可选，桌面整理时补）">
              <textarea
                name="summary"
                rows={3}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </Field>
          ) : null}
        </>
      ) : (
        <>
          <Field label="标题">
            <input
              name="title"
              required
              placeholder={
                type === "opinion" ? "例如：跨城管理的三个观察" : "例如：待办标签交互想法"
              }
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="内容">
            <textarea
              name="content"
              required
              rows={compact ? 4 : 6}
              placeholder="写下你的观点或灵感"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </Field>
        </>
      )}

      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="关联城市（可选）">
            <select
              name="cityId"
              defaultValue=""
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              <option value="">不关联</option>
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
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              <option value="">不关联</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          标签
        </label>
        <TagPicker
          options={tags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "保存中..." : `保存${NOTE_TYPES[type]}`}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
