import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(40),
  icon: z.string().min(1).max(4),
  color: z.string().min(1),
});
