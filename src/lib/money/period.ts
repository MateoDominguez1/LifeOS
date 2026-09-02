import { prisma } from "@/lib/db/prisma";
import { calculateCurrentBudgetPeriod, type BudgetPeriod } from "./calculateCurrentBudgetPeriod";
import type { Income } from "@/generated/prisma/client";

/**
 * El ciclo de presupuesto se ancla al primer ingreso recurrente activo del
 * usuario (su sueldo principal). Si todavía no configuró ninguno, se usa el
 * mes calendario como aproximación razonable.
 */
export async function getPrimaryIncomeAndPeriod(
  userId: string,
  today: Date
): Promise<{ primaryIncome: Income | null; period: BudgetPeriod }> {
  const primaryIncome = await prisma.income.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const period: BudgetPeriod = primaryIncome
    ? calculateCurrentBudgetPeriod(primaryIncome.dayOfMonth, today)
    : {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };

  return { primaryIncome, period };
}
