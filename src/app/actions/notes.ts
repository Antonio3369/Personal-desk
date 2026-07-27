"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
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
};

async function upsertTags(tagNames: string[] = []) {
  const tags = [];
  for (const name of tagNames.map((item) => item.trim()).filter(Boolean)) {
    const tag = await db.tag.upsert({
      where: { name },
      update: { usageCount: { increment: 1 } },
      create: { name, usageCount: 1 },
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
  }
}

export async function createNoteAction(input: NoteInput) {
  const note = await db.note.create({
    data: {
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
    const tags = await upsertTags(input.tagNames);
    await db.noteTag.createMany({
      data: tags.map((tag) => ({ noteId: note.id, tagId: tag.id })),
    });
  }

  revalidateNotePaths(note.cityId, note.contactId);
  return note;
}

export async function updateNoteAction(id: string, input: Partial<NoteInput>) {
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
    const tags = await upsertTags(input.tagNames);
    if (tags.length) {
      await db.noteTag.createMany({
        data: tags.map((tag) => ({ noteId: id, tagId: tag.id })),
      });
    }
  }

  revalidateNotePaths(note.cityId, note.contactId);
  return note;
}

export async function deleteNoteAction(id: string) {
  const note = await db.note.delete({ where: { id } });
  revalidateNotePaths(note.cityId, note.contactId);
}

export async function toggleNoteReadAction(id: string, read: boolean) {
  await updateNoteAction(id, { readStatus: read ? "read" : "unread" });
}
