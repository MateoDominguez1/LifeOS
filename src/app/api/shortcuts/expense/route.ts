import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { verifyApiToken } from "@/lib/money/apiTokens/verifyApiToken";
import { shortcutExpenseSchema } from "@/lib/money/validation/apiTokens";
import { createTransactionCore } from "@/lib/money/core/createTransactionCore";

/**
 * Endpoint para automatizaciones externas (ej. un Atajo de iOS) que
 * necesitan cargar un movimiento sin abrir la app ni tener una sesión de
 * navegador. Se autentica con un token personal (Authorization: Bearer
 * <token>), generado y revocable desde /money/settings — nunca con la
 * contraseña de la cuenta.
 */
export async function POST(request: Request) {
  const userId = await verifyApiToken(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Token inválido o ausente" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "El cuerpo del pedido debe ser JSON" }, { status: 400 });
  }

  const parsed = shortcutExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { type, amount, description, account, category, note, date } = parsed.data;

  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  if (accounts.length === 0) {
    return NextResponse.json({ ok: false, error: "No hay cuentas activas" }, { status: 400 });
  }
  const matchedAccount = account
    ? accounts.find((a) => a.name.toLowerCase() === account.toLowerCase())
    : undefined;
  if (account && !matchedAccount) {
    return NextResponse.json({ ok: false, error: `No encontré la cuenta "${account}"` }, { status: 404 });
  }
  const accountId = (matchedAccount ?? accounts[0]).id;

  let categoryId: string | null = null;
  if (category) {
    const matchedCategory = await prisma.category.findFirst({
      where: { OR: [{ userId }, { userId: null }], name: { equals: category, mode: "insensitive" } },
      select: { id: true },
    });
    categoryId = matchedCategory?.id ?? null;
  }

  const result = await createTransactionCore({
    userId,
    type,
    amount,
    description,
    categoryId,
    accountId,
    date: date ?? new Date(),
    note,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  revalidatePath("/money/accounts");
  revalidatePath("/money");
  revalidatePath("/money/transactions");

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
    balance: result.newBalance,
    message: `${type === "EXPENSE" ? "Gasto" : "Ingreso"} agregado: ${description}`,
  });
}
