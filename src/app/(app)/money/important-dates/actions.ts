"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { importantDateSchema } from "@/lib/money/validation/importantDates";

export type ActionState = { error?: string } | undefined;

function parseImportantDateForm(formData: FormData) {
  return importantDateSchema.safeParse({
    personName: formData.get("personName"),
    relationship: formData.get("relationship") || undefined,
    type: formData.get("type"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
    reminderDaysBefore: formData.get("reminderDaysBefore"),
    isActive: formData.get("isActive") ? true : false,
  });
}

export async function createImportantDateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseImportantDateForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.importantDate.create({
    data: { ...parsed.data, relationship: parsed.data.relationship || null, userId },
  });

  revalidatePath("/money/important-dates");
  revalidatePath("/money");
  redirect("/money/important-dates");
}

export async function updateImportantDateAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseImportantDateForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await prisma.importantDate.findFirst({ where: { id, userId } });
  if (!existing) return { error: "No encontrado" };

  await prisma.importantDate.update({
    where: { id },
    data: { ...parsed.data, relationship: parsed.data.relationship || null },
  });

  revalidatePath("/money/important-dates");
  revalidatePath("/money");
  redirect("/money/important-dates");
}

export async function toggleImportantDateActiveAction(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.importantDate.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("No encontrado");

  await prisma.importantDate.update({ where: { id }, data: { isActive: !existing.isActive } });

  revalidatePath("/money/important-dates");
  revalidatePath("/money");
}

export async function deleteImportantDateAction(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.importantDate.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("No encontrado");

  await prisma.importantDate.delete({ where: { id } });

  revalidatePath("/money/important-dates");
  revalidatePath("/money");
}
