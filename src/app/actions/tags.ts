"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function revalidateTagPaths() {
  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/todos");
  revalidatePath("/capture");
}

export async function deleteTagAction(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;

  await db.tag.delete({
    where: { name: trimmed },
  });

  revalidateTagPaths();
}

export async function renameTagAction(oldName: string, newName: string) {
  const oldTrimmed = oldName.trim();
  const newTrimmed = newName.trim().replace(/^#/, "");

  if (!oldTrimmed || !newTrimmed) {
    return { ok: false as const, error: "标签名不能为空" };
  }

  if (oldTrimmed === newTrimmed) {
    return { ok: true as const, name: newTrimmed };
  }

  const duplicate = await db.tag.findUnique({
    where: { name: newTrimmed },
  });
  if (duplicate) {
    return { ok: false as const, error: "该标签名已存在" };
  }

  const tag = await db.tag.findUnique({ where: { name: oldTrimmed } });
  if (!tag) {
    return { ok: false as const, error: "标签不存在" };
  }

  await db.tag.update({
    where: { name: oldTrimmed },
    data: { name: newTrimmed },
  });

  revalidateTagPaths();
  return { ok: true as const, name: newTrimmed };
}

