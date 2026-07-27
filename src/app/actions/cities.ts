"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createCityIssueAction(input: {
  cityId: string;
  type: "team" | "business";
  content: string;
}) {
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
