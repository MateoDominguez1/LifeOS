"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getT } from "@/lib/i18n";

export async function createManagedProfile(input: { name: string; relationship?: string }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  if (!input.name.trim()) {
    throw new Error(t.fitness.people.nameRequiredError);
  }

  const profile = await prisma.managedProfile.create({
    data: { ownerId: userId, name: input.name.trim(), relationship: input.relationship?.trim() || null },
  });

  revalidatePath("/fitness/people");
  return { id: profile.id };
}

export async function updateManagedProfile(id: string, input: { name: string; relationship?: string }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const profile = await prisma.managedProfile.findUnique({ where: { id } });
  if (!profile || profile.ownerId !== userId) throw new Error(t.fitness.common.notAuthorizedError);

  if (!input.name.trim()) {
    throw new Error(t.fitness.people.nameRequiredError);
  }

  await prisma.managedProfile.update({
    where: { id },
    data: { name: input.name.trim(), relationship: input.relationship?.trim() || null },
  });

  revalidatePath("/fitness/people");
  revalidatePath(`/fitness/people/${id}`);
}

export async function deleteManagedProfile(id: string) {
  const userId = await requireUserId();

  await prisma.managedProfile.deleteMany({ where: { id, ownerId: userId } });

  revalidatePath("/fitness/people");
}
