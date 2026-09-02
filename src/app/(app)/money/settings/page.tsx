import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { PushNotificationsCard } from "@/components/money/push-notifications-card";
import { ApiTokensCard } from "@/components/money/api-tokens-card";
import { AddCategoryForm } from "./add-category-form";
import { deleteCategoryAction } from "./actions";

export default async function MoneySettingsPage() {
  const userId = await requireUserId();

  const [categories, apiTokens] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastUsedAt: true },
    }),
  ]);

  return (
    <div>
      <MoneyNav />
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-xl font-bold">Ajustes de Money</h1>

        <PushNotificationsCard />

        <ApiTokensCard
          tokens={apiTokens.map((token) => ({
            id: token.id,
            name: token.name,
            lastUsedAt: token.lastUsedAt ? token.lastUsedAt.toISOString() : null,
          }))}
        />

        <Card>
          <CardLabel>Categorías</CardLabel>
          <p className="mt-1 text-sm text-ink-soft">Las que uses para clasificar gastos y presupuestos.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-2 text-sm"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: `${category.color}33` }}
                >
                  {category.icon}
                </span>
                {category.name}
                {category.isDefault ? (
                  <span className="rounded bg-border-soft px-1.5 py-0.5 text-xs text-ink-faint">Sistema</span>
                ) : (
                  <form action={deleteCategoryAction.bind(null, category.id)}>
                    <button type="submit" className="text-ink-faint hover:text-danger" aria-label="Eliminar">
                      ×
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border-soft pt-4">
            <AddCategoryForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
