"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signIn } from "@/lib/auth/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(1, "Ingresá tu nombre."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres."),
});

export interface RegisterState {
  error?: string;
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "La cuenta se creó, pero no se pudo iniciar sesión automáticamente. Probá ingresar manualmente." };
    }
    throw err;
  }

  return {};
}
