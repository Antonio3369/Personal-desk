"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireModuleAccess } from "@/lib/module-guard";

function revalidateTagPaths() {
  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/todos");
  revalidatePath("/capture");
}

export async function deleteTagAction(name: string) {
  const { workspaceId } = await requireModuleAccess("notes");
  const trimmed = name.trim();
  if (!trimmed) return;

  await db.tag.delete({
    where: { workspaceId_name: { workspaceId, name: trimmed } },
  });

  revalidateTagPaths();
}

export async function renameTagAction(oldName: string, newName: string) {
  const { workspaceId } = await requireModuleAccess("notes");
  const oldTrimmed = oldName.trim();
  const newTrimmed = newName.trim().replace(/^#/, "");

  if (!oldTrimmed || !newTrimmed) {
    return { ok: false as const, error: "标签名不能为空" };
  }

  if (oldTrimmed === newTrimmed) {
    return { ok: true as const, name: newTrimmed };
  }

  const duplicate = await db.tag.findUnique({
    where: { workspaceId_name: { workspaceId, name: newTrimmed } },
  });
  if (duplicate) {
    return { ok: false as const, error: "该标签名已存在" };
  }

  const tag = await db.tag.findUnique({
    where: { workspaceId_name: { workspaceId, name: oldTrimmed } },
  });
  if (!tag) {
    return { ok: false as const, error: "标签不存在" };
  }

  await db.tag.update({
    where: { workspaceId_name: { workspaceId, name: oldTrimmed } },
    data: { name: newTrimmed },
  });

  revalidateTagPaths();
  return { ok: true as const, name: newTrimmed };
}
