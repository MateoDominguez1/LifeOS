import { z } from "zod";

export const IMPORTANT_DATE_TYPES = ["BIRTHDAY", "ANNIVERSARY", "OTHER"] as const;

export const importantDateSchema = z.object({
  personName: z.string().min(1, "El nombre es obligatorio").max(60),
  relationship: z.string().max(40).optional().or(z.literal("")),
  type: z.enum(IMPORTANT_DATE_TYPES),
  date: z.coerce.date(),
  note: z.string().max(200).optional().or(z.literal("")),
  reminderDaysBefore: z.coerce.number().int().min(0).max(180).default(14),
  isActive: z.coerce.boolean().default(true),
});
