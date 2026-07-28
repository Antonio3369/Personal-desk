"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizeLearningLink } from "@/lib/link-utils";
import { requireModuleAccess } from "@/lib/module-guard";
import {
  deleteUploadImageFiles,
} from "@/lib/upload-images";
import type { NotePlatform, NoteType, ReadStatus } from "@/lib/constants";

type NoteInput = {
  type: NoteType;
  title?: string | null;
  content?: string | null;
  link?: string | null;
  platform?: NotePlatform | null;
  highlight?: string | null;
  summary?: string | null;
  readStatus?: ReadStatus;
  cityId?: string | null;
  contactId?: string | null;
  tagNames?: string[];
  imagePaths?: string[];
  addImagePaths?: string[];
};

async function upsertTags(workspaceId: string, tagNames: string[] = []) {
  const tags = [];
  for (const name of tagNames.map((item) => item.trim()).filter(Boolean)) {
    const tag = await db.tag.upsert({
      where: { workspaceId_name: { workspaceId, name } },
      update: { usageCount: { increment: 1 } },
      create: { workspaceId, name, usageCount: 1 },
    });
    tags.push(tag);
  }
  return tags;
}

function revalidateNotePaths(cityId?: string | null, contactId?: string | null) {
  revalidatePath("/notes");
  revalidatePath("/capture");
  if (cityId) {
    revalidatePath(`/cities/${cityId}`);
  }
  if (contactId) {
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
  }
}

export async function createNoteFromFormAction(formData: FormData) {
  const type = String(formData.get("type") ?? "learning") as NoteType;
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rawLink = String(formData.get("link") ?? "");
  const normalized = normalizeLearningLink(rawLink);
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const imagePaths = JSON.parse(
    String(formData.get("imagePaths") ?? "[]"),
  ) as string[];

  if (type === "learning") {
    if (!normalized && !imagePaths.length) {
      throw new Error("请粘贴有效链接，或添加图片");
    }
  } else if (!title && !content && !imagePaths.length) {
    throw new Error("请填写标题、内容或添加图片");
  }

  return createNoteAction({
    type,
    title: title || (imagePaths.length ? "（见附图）" : null),
    content: content || (imagePaths.length && type !== "learning" ? "（见附图）" : null),
    link: normalized?.link ?? (rawLink.trim() || null),
    platform:
      type === "learning"
        ? (String(formData.get("platform") ?? "other") as NotePlatform)
        : null,
    highlight: String(formData.get("highlight") ?? "") || null,
    summary: String(formData.get("summary") ?? "") || null,
    cityId: String(formData.get("cityId") ?? "") || null,
    contactId: String(formData.get("contactId") ?? "") || null,
    tagNames,
    imagePaths,
  });
}

export async function updateNoteFromFormAction(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const addImagePaths = JSON.parse(
    String(formData.get("imagePaths") ?? "[]"),
  ) as string[];

  if (!title && !content && !addImagePaths.length) {
    const { workspaceId } = await requireModuleAccess("notes");
    const imageCount = await db.noteImage.count({
      where: { noteId: id, note: { workspaceId } },
    });
    if (!imageCount) {
      throw new Error("请填写内容或添加图片");
    }
  }

  return updateNoteAction(id, {
    title: title || undefined,
    content: content || undefined,
    link: String(formData.get("link") ?? "") || null,
    platform: String(formData.get("platform") ?? "") as NotePlatform | null,
    highlight: String(formData.get("highlight") ?? "") || null,
    summary: String(formData.get("summary") ?? "") || null,
    readStatus: String(formData.get("readStatus") ?? "unread") as ReadStatus,
    tagNames,
    addImagePaths,
  });
}

export async function createNoteAction(input: NoteInput) {
  const { workspaceId } = await requireModuleAccess("notes");

  const note = await db.note.create({
    data: {
      workspaceId,
      type: input.type,
      title: input.title?.trim() || null,
      content: input.content?.trim() || null,
      link: input.link?.trim() || null,
      platform: input.platform ?? null,
      highlight: input.highlight?.trim() || null,
      summary: input.summary?.trim() || null,
      readStatus: input.readStatus ?? "unread",
      cityId: input.cityId || null,
      contactId: input.contactId || null,
    },
  });

  if (input.tagNames?.length) {
    const tags = await upsertTags(workspaceId, input.tagNames);
    await db.noteTag.createMany({
      data: tags.map((tag) => ({ noteId: note.id, tagId: tag.id })),
    });
  }

  if (input.imagePaths?.length) {
    await db.noteImage.createMany({
      data: input.imagePaths.map((path) => ({ noteId: note.id, path })),
    });
  }

  revalidateNotePaths(note.cityId, note.contactId);
  return note;
}

export async function updateNoteAction(id: string, input: Partial<NoteInput>) {
  const { workspaceId } = await requireModuleAccess("notes");
  const existing = await db.note.findFirst({ where: { id, workspaceId } });
  if (!existing) {
    throw new Error("笔记不存在");
  }

  const note = await db.note.update({
    where: { id },
    data: {
      title: input.title === undefined ? undefined : input.title?.trim() || null,
      content:
        input.content === undefined ? undefined : input.content?.trim() || null,
      link: input.link === undefined ? undefined : input.link?.trim() || null,
      platform: input.platform === undefined ? undefined : input.platform || null,
      highlight:
        input.highlight === undefined ? undefined : input.highlight?.trim() || null,
      summary:
        input.summary === undefined ? undefined : input.summary?.trim() || null,
      readStatus: input.readStatus,
      cityId: input.cityId === undefined ? undefined : input.cityId || null,
      contactId:
        input.contactId === undefined ? undefined : input.contactId || null,
    },
  });

  if (input.tagNames) {
    await db.noteTag.deleteMany({ where: { noteId: id } });
    const tags = await upsertTags(workspaceId, input.tagNames);
    if (tags.length) {
      await db.noteTag.createMany({
        data: tags.map((tag) => ({ noteId: id, tagId: tag.id })),
      });
    }
  }

  if (input.addImagePaths?.length) {
    await db.noteImage.createMany({
      data: input.addImagePaths.map((path) => ({ noteId: id, path })),
    });
  }

  revalidateNotePaths(note.cityId, note.contactId);
  return note;
}

export async function deleteNoteAction(id: string) {
  const { workspaceId } = await requireModuleAccess("notes");
  const note = await db.note.findFirst({ where: { id, workspaceId } });
  if (!note) {
    throw new Error("笔记不存在");
  }

  const images = await db.noteImage.findMany({
    where: { noteId: id },
    select: { path: true },
  });
  await db.note.delete({ where: { id } });
  await deleteUploadImageFiles(images.map((image) => image.path));
  revalidateNotePaths(note.cityId, note.contactId);
}

export async function toggleNoteReadAction(id: string, read: boolean) {
  await updateNoteAction(id, { readStatus: read ? "read" : "unread" });
}
