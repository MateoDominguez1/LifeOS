import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ported as-is from smart-monthly-budget's seed — same default Money
// categories, so migrated transactions keep resolving to a category with
// the same name instead of landing in a freshly-invented list.
const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: "Supermercado", icon: "🛒", color: "#16a34a" },
  { name: "Alquiler", icon: "🏠", color: "#dc2626" },
  { name: "Transporte", icon: "🚌", color: "#2563eb" },
  { name: "Restaurantes", icon: "🍽️", color: "#ea580c" },
  { name: "Compras", icon: "🛍️", color: "#c026d3" },
  { name: "Entretenimiento", icon: "🎬", color: "#9333ea" },
  { name: "Suscripciones", icon: "🔁", color: "#0891b2" },
  { name: "Salud", icon: "💊", color: "#e11d48" },
  { name: "Educación", icon: "🎓", color: "#4338ca" },
  { name: "Viajes", icon: "✈️", color: "#0d9488" },
  { name: "Otros", icon: "📦", color: "#6b7280" },
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });
    if (existing) continue;

    await prisma.category.create({
      data: { ...category, isDefault: true },
    });
  }

  console.log(`Seed listo: ${DEFAULT_CATEGORIES.length} categorías por defecto.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
