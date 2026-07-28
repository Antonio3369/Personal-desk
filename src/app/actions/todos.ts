"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getFormOptions } from "@/lib/queries";
import {
  deleteUploadImageFiles,
} from "@/lib/upload-images";
import { requireModuleAccess } from "@/lib/module-guard";
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

async function assertTodoInWorkspace(id: string, workspaceId: string) {
  const todo = await db.todo.findFirst({ where: { id, workspaceId } });
  if (!todo) {
    throw new Error("待办不存在");
  }
  return todo;
}

export async function createTodoFromFormAction(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const scope = (String(formData.get("scope") ?? "work") || "work") as TodoScope;
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const imagePaths = JSON.parse(
    String(formData.get("imagePaths") ?? "[]"),
  ) as string[];

  if (!content && !imagePaths.length) {
    throw new Error("请填写内容或添加图片");
  }

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
  await requireModuleAccess("todos");
  return getFormOptions();
}

export async function updateTodoFromFormAction(id: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const scope = (String(formData.get("scope") ?? "work") || "work") as TodoScope;
  const tagNames = JSON.parse(String(formData.get("tagNames") ?? "[]")) as string[];
  const progress = String(formData.get("progress") ?? "not_started") as TodoProgress;
  const addImagePaths = JSON.parse(
    String(formData.get("imagePaths") ?? "[]"),
  ) as string[];

  if (!content) {
    const { workspaceId } = await requireModuleAccess("todos");
    const imageCount = await db.todoImage.count({
      where: { todoId: id, todo: { workspaceId } },
    });
    if (!imageCount && !addImagePaths.length) {
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
    addImagePaths,
  });
}

export async function createTodoAction(input: TodoInput) {
  const { workspaceId } = await requireModuleAccess("todos");

  const todo = await db.todo.create({
    data: {
      workspaceId,
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
    const tags = await upsertTags(workspaceId, input.tagNames);
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
  const { workspaceId } = await requireModuleAccess("todos");
  await assertTodoInWorkspace(id, workspaceId);

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
    const tags = await upsertTags(workspaceId, input.tagNames);
    if (tags.length) {
      await db.todoTag.createMany({
        data: tags.map((tag) => ({ todoId: id, tagId: tag.id })),
      });
    }
  }

  if (input.addImagePaths?.length) {
    await db.todoImage.createMany({
      data: input.addImagePaths.map((path) => ({ todoId: id, path })),
    });
  }

  revalidatePath("/");
  revalidatePath("/todos");
  if (todo.cityId) {
    revalidatePath(`/cities/${todo.cityId}`);
  }
  return todo;
}

export async function deleteTodoAction(id: string) {
  const { workspaceId } = await requireModuleAccess("todos");
  await assertTodoInWorkspace(id, workspaceId);

  const images = await db.todoImage.findMany({
    where: { todoId: id },
    select: { path: true },
  });
  const todo = await db.todo.delete({ where: { id } });
  await deleteUploadImageFiles(images.map((image) => image.path));
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
