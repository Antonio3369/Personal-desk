"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getFormOptions } from "@/lib/queries";
import {
  deleteTodoImageFiles,
  getTodoImageFiles,
  saveTodoImages,
} from "@/lib/todo-images";
import type { TodoProgress, TodoScope } from "@/lib/constants";

type TodoInput = {
  content: string;
  scope?: TodoScope;
  nature?: string | null;
  progress?: TodoProgress;
  followUpDate?: string | null;
  source?: string | null;
  cityId?: string | null;
  contactId?: string | null;
  tagNames?: string[];
  imagePaths?: string[];
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

export async function createTodoFromFormAction(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const scope = (String(formData.get("scope") ?? "work") || "work") as TodoScope;
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const imageFiles = getTodoImageFiles(formData);

  if (!content && !imageFiles.length) {
    throw new Error("请填写内容或添加图片");
  }

  const imagePaths = imageFiles.length ? await saveTodoImages(imageFiles) : [];

  return createTodoAction({
    content: content || "（见附图）",
    scope,
    nature: String(formData.get("nature") ?? "") || null,
    progress: String(formData.get("progress") ?? "not_started") as TodoProgress,
    followUpDate: String(formData.get("followUpDate") ?? "") || null,
    cityId: String(formData.get("cityId") ?? "") || null,
    contactId: String(formData.get("contactId") ?? "") || null,
    tagNames,
    imagePaths,
  });
}

export async function getTodoEditOptionsAction() {
  return getFormOptions();
}

export async function updateTodoFromFormAction(id: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const scope = (String(formData.get("scope") ?? "work") || "work") as TodoScope;
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const progress = String(formData.get("progress") ?? "not_started") as TodoProgress;

  if (!content) {
    const imageCount = await db.todoImage.count({ where: { todoId: id } });
    if (!imageCount) {
      throw new Error("请填写内容");
    }
  }

  return updateTodoAction(id, {
    content: content || "（见附图）",
    scope,
    nature: String(formData.get("nature") ?? "") || null,
    progress,
    followUpDate: String(formData.get("followUpDate") ?? "") || null,
    cityId: String(formData.get("cityId") ?? "") || null,
    contactId: String(formData.get("contactId") ?? "") || null,
    tagNames,
  });
}

export async function createTodoAction(input: TodoInput) {
  const todo = await db.todo.create({
    data: {
      content: input.content.trim(),
      scope: input.scope ?? "work",
      nature: input.nature ?? null,
      progress: input.progress ?? "not_started",
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      source: input.source ?? null,
      cityId: input.cityId || null,
      contactId: input.contactId || null,
    },
  });

  if (input.tagNames?.length) {
    const tags = await upsertTags(input.tagNames);
    await db.todoTag.createMany({
      data: tags.map((tag) => ({ todoId: todo.id, tagId: tag.id })),
    });
  }

  if (input.imagePaths?.length) {
    await db.todoImage.createMany({
      data: input.imagePaths.map((path) => ({ todoId: todo.id, path })),
    });
  }

  revalidatePath("/");
  revalidatePath("/todos");
  revalidatePath("/capture");
  if (input.cityId) {
    revalidatePath(`/cities/${input.cityId}`);
  }
  return todo;
}

export async function updateTodoAction(id: string, input: Partial<TodoInput>) {
  const todo = await db.todo.update({
    where: { id },
    data: {
      content: input.content?.trim(),
      scope: input.scope,
      nature: input.nature,
      progress: input.progress,
      followUpDate:
        input.followUpDate === undefined
          ? undefined
          : input.followUpDate
            ? new Date(input.followUpDate)
            : null,
      source: input.source,
      cityId: input.cityId === undefined ? undefined : input.cityId || null,
      contactId:
        input.contactId === undefined ? undefined : input.contactId || null,
      completedAt:
        input.progress === undefined
          ? undefined
          : input.progress === "done"
            ? new Date()
            : null,
    },
  });

  if (input.tagNames) {
    await db.todoTag.deleteMany({ where: { todoId: id } });
    const tags = await upsertTags(input.tagNames);
    if (tags.length) {
      await db.todoTag.createMany({
        data: tags.map((tag) => ({ todoId: id, tagId: tag.id })),
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/todos");
  if (todo.cityId) {
    revalidatePath(`/cities/${todo.cityId}`);
  }
  return todo;
}

export async function deleteTodoAction(id: string) {
  const images = await db.todoImage.findMany({
    where: { todoId: id },
    select: { path: true },
  });
  const todo = await db.todo.delete({ where: { id } });
  await deleteTodoImageFiles(images.map((image) => image.path));
  revalidatePath("/");
  revalidatePath("/todos");
  if (todo.cityId) {
    revalidatePath(`/cities/${todo.cityId}`);
  }
}

export async function toggleTodoDoneAction(id: string, done: boolean) {
  await updateTodoAction(id, {
    progress: done ? "done" : "not_started",
  });
}
