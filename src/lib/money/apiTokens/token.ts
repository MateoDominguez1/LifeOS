import { randomBytes, createHash } from "crypto";

const TOKEN_PREFIX = "lifeos_";

/** Token de alta entropía (32 bytes) para automatizaciones externas. */
export function generateApiToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

/**
 * Hash determinístico para poder buscar el token por igualdad en la base.
 * SHA-256 (no bcrypt): es un secreto random de alta entropía generado por la
 * app, no una contraseña elegida por una persona, así que no hace falta un
 * hash lento pensado para resistir diccionarios.
 */
export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
