import { NOTE_TYPES, type NoteType } from "@/lib/constants";

const MAX_SOURCE_LENGTH = 12_000;

export type NoteSummarySource = {
  type: string;
  title: string | null;
  content: string | null;
  link: string | null;
  highlight: string | null;
  tags?: { tag: { name: string } }[];
};

export function buildNoteSourceText(note: NoteSummarySource) {
  const parts: string[] = [];
  const typeLabel = NOTE_TYPES[note.type as NoteType] ?? note.type;
  parts.push(`类型：${typeLabel}`);

  if (note.title?.trim()) {
    parts.push(`标题：${note.title.trim()}`);
  }
  if (note.link?.trim()) {
    parts.push(`链接：${note.link.trim()}`);
  }
  if (note.highlight?.trim()) {
    parts.push(`亮点：${note.highlight.trim()}`);
  }
  if (note.content?.trim()) {
    parts.push(`正文：\n${note.content.trim()}`);
  }
  if (note.tags?.length) {
    parts.push(`标签：${note.tags.map(({ tag }) => tag.name).join("、")}`);
  }

  const text = parts.join("\n\n");
  if (text.length <= MAX_SOURCE_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_SOURCE_LENGTH)}\n\n（内容已截断）`;
}

export function hasNoteSummarySource(note: NoteSummarySource) {
  return Boolean(
    note.title?.trim() ||
      note.content?.trim() ||
      note.highlight?.trim() ||
      note.link?.trim(),
  );
}
