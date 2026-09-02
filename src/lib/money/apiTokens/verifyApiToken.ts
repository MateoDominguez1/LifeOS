import { prisma } from "@/lib/db/prisma";
import { hashApiToken } from "./token";

/** Valida el header `Authorization: Bearer <token>` de un pedido externo
 * (ej. un Atajo de iOS) y devuelve el userId dueño del token, o null si no
 * hay token, no matchea ninguno guardado, o el header está mal formado. */
export async function verifyApiToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const tokenHash = hashApiToken(token);
  const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash } });
  if (!apiToken) return null;

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return apiToken.userId;
}
