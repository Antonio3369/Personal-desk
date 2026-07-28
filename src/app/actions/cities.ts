"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requireCityModuleAccess,
  requireModuleAccess,
} from "@/lib/module-guard";

async function assertCityInWorkspace(cityId: string, workspaceId: string) {
  const city = await db.city.findFirst({ where: { id: cityId, workspaceId } });
  if (!city) {
    throw new Error("城市不存在");
  }
  return city;
}

export async function createCityAction(name: string) {
  const { workspaceId } = await requireCityModuleAccess("create");

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("请输入城市名称");
  }

  const existing = await db.city.findFirst({
    where: { workspaceId, name: trimmed },
    select: { id: true },
  });
  if (existing) {
    throw new Error("该城市已存在");
  }

  const lastCity = await db.city.findMany({
    where: { workspaceId },
    orderBy: { sortOrder: "desc" },
    take: 1,
    select: { sortOrder: true },
  });

  const city = await db.city.create({
    data: {
      workspaceId,
      name: trimmed,
      sortOrder: (lastCity[0]?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/cities");
  revalidatePath("/");
  return city;
}

export async function deleteCityAction(id: string) {
  const { workspaceId } = await requireCityModuleAccess("delete");
  await assertCityInWorkspace(id, workspaceId);

  await db.$transaction([
    db.todo.updateMany({ where: { cityId: id }, data: { cityId: null } }),
    db.contact.updateMany({ where: { cityId: id }, data: { cityId: null } }),
    db.note.updateMany({ where: { cityId: id }, data: { cityId: null } }),
    db.city.delete({ where: { id } }),
  ]);

  revalidatePath("/cities");
  revalidatePath("/");
}

export async function createCityIssueAction(input: {
  cityId: string;
  type: "team" | "business";
  content: string;
}) {
  const { workspaceId } = await requireModuleAccess("cities");
  await assertCityInWorkspace(input.cityId, workspaceId);

  const content = input.content.trim();
  if (!content) return;

  await db.cityIssue.create({
    data: {
      cityId: input.cityId,
      type: input.type,
      content,
    },
  });

  revalidatePath(`/cities/${input.cityId}`);
  revalidatePath("/cities");
}

export async function resolveCityIssueAction(
  id: string,
  cityId: string,
  resolveOutcome?: string | null,
) {
  const { workspaceId } = await requireModuleAccess("cities");
  await assertCityInWorkspace(cityId, workspaceId);

  await db.cityIssue.update({
    where: { id },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      resolveOutcome: resolveOutcome?.trim() || null,
    },
  });

  revalidatePath(`/cities/${cityId}`);
  revalidatePath("/cities");
}

export async function reopenCityIssueAction(id: string, cityId: string) {
  const { workspaceId } = await requireModuleAccess("cities");
  await assertCityInWorkspace(cityId, workspaceId);

  await db.cityIssue.update({
    where: { id },
    data: {
      status: "open",
      resolvedAt: null,
      resolveOutcome: null,
    },
  });

  revalidatePath(`/cities/${cityId}`);
  revalidatePath("/cities");
}

export async function deleteCityIssueAction(id: string, cityId: string) {
  const { workspaceId } = await requireModuleAccess("cities");
  await assertCityInWorkspace(cityId, workspaceId);

  await db.cityIssue.delete({ where: { id } });
  revalidatePath(`/cities/${cityId}`);
  revalidatePath("/cities");
}

export async function updateCityAction(
  id: string,
  data: {
    notes?: string | null;
    leaderLink?: string | null;
    leaderContactId?: string | null;
  },
) {
  const { workspaceId } = await requireModuleAccess("cities");
  await assertCityInWorkspace(id, workspaceId);

  const city = await db.city.update({
    where: { id },
    data,
  });

  revalidatePath("/cities");
  revalidatePath(`/cities/${id}`);
  revalidatePath("/");
  return city;
}

export async function reorderCitiesAction(cityIds: string[]) {
  const { workspaceId } = await requireModuleAccess("cities");

  const cities = await db.city.findMany({
    where: { workspaceId, id: { in: cityIds } },
    select: { id: true },
  });
  if (cities.length !== cityIds.length) {
    throw new Error("城市列表无效");
  }

  await db.$transaction(
    cityIds.map((id, index) =>
      db.city.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/cities");
  revalidatePath("/");
}
