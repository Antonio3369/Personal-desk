"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createContactAction(input: {
  name: string;
  role?: string | null;
  organization?: string | null;
  relationType?: string | null;
  cityId?: string | null;
  notes?: string | null;
  interactionSummary?: string | null;
}) {
  const contact = await db.contact.create({
    data: {
      name: input.name.trim(),
      role: input.role ?? null,
      organization: input.organization ?? null,
      relationType: input.relationType ?? null,
      cityId: input.cityId || null,
      notes: input.notes ?? null,
      interactionSummary: input.interactionSummary ?? null,
      lastInteractionAt: input.interactionSummary ? new Date() : null,
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/");
  if (input.cityId) {
    revalidatePath(`/cities/${input.cityId}`);
  }
  return contact;
}

export async function updateContactAction(
  id: string,
  input: Partial<{
    name: string;
    role: string | null;
    organization: string | null;
    relationType: string | null;
    cityId: string | null;
    notes: string | null;
    interactionSummary: string | null;
  }>,
) {
  const contact = await db.contact.update({
    where: { id },
    data: {
      ...input,
      name: input.name?.trim(),
      cityId: input.cityId === undefined ? undefined : input.cityId || null,
      lastInteractionAt: input.interactionSummary ? new Date() : undefined,
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/");
  if (contact.cityId) {
    revalidatePath(`/cities/${contact.cityId}`);
  }
  return contact;
}
