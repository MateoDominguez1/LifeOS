# LifeOS

Centro de control personal que unifica Money (ex smart-monthly-budget), Nutrition (ex Clorias) y Fitness (ex GYM) en una sola aplicación, una sola base de datos y un solo login.

Este repo está en **Fase 4 — LifeOS Foundation**: auth unificado, base de datos unificada, navegación y sistema de diseño. Los módulos de Money/Nutrition/Fitness todavía no están migrados — ver el plan de migración y la auditoría completa en los documentos del proyecto.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 + Postgres · NextAuth v5 (Credentials + JWT)

## Desarrollo

```bash
npm install
cp .env.example .env   # completar DATABASE_URL y AUTH_SECRET
npm run db:migrate      # crea las tablas en tu Postgres
npm run dev
```

## Estructura

```
prisma/schema.prisma        Schema unificado (Fase 2)
src/app/(auth)/              Login / registro
src/app/(app)/                Shell autenticado: dashboard, money, nutrition, fitness, progress, ai, settings
src/lib/auth/                 NextAuth v5, Credentials + JWT
src/lib/db/prisma.ts          Cliente Prisma singleton
src/components/ui/            Primitivos del sistema de diseño
src/components/layout/        Sidebar (desktop) y navegación inferior (mobile)
scripts/backup/                Herramienta de backup de solo lectura para las tres apps originales (Fase 3)
```
