import { z } from "zod";

export const createApiTokenSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
});

// .trim() en los campos de texto: automatizaciones externas (ej. Atajos de
// iOS) suelen agregar espacios o saltos de línea de más sin que el usuario
// se dé cuenta, lo que rompe la búsqueda exacta de cuenta/categoría por
// nombre si no se limpia acá.
export const shortcutExpenseSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(120),
  account: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  note: z.string().trim().max(200).optional(),
  date: z.coerce.date().optional(),
});
