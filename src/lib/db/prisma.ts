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
  const adapter = new PrismaPg({
    connectionString: getServerEnv().DATABASE_URL,
    // Serverless functions run one request at a time per instance, but
    // pg.Pool defaults to `max: 10` — every cold start would otherwise try
    // to open up to 10 connections against Postgres (or your connection
    // pooler's own connection budget), which adds up fast across concurrent
    // invocations and can leave requests hanging while they wait for a
    // slot rather than failing fast. One connection per instance is enough.
    max: 1,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
