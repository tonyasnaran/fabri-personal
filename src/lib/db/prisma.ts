import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerEnv } from "@/config/env";

/**
 * Prisma 7 requires an explicit driver adapter rather than reading the
 * connection string implicitly from the schema's datasource block.
 * Cached on globalThis in development so route/module hot-reloading
 * doesn't exhaust the Postgres connection pool.
 */

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getServerEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
