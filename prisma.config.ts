import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Same pattern as smart-monthly-budget and GYM: Prisma 7 moved the
// connection URL out of schema.prisma and into this config file.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
