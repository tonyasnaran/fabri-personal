import "server-only";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/security/logger";
import type { Prisma } from "@/generated/prisma/client";

export type AuditEventInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, Prisma.InputJsonValue>;
  ipAddress?: string | null;
};

/**
 * Writes an AuditLog row. Deliberately never throws — a failed audit write
 * must not block or fail the security-relevant action it describes (e.g. a
 * successful sign-in). On failure, the error is recorded via the structured
 * logger (which already redacts sensitive fields) instead of surfacing to
 * the caller.
 *
 * Callers must not pass OAuth codes/tokens, session tokens, magic-link
 * tokens, or API keys in `metadata` — this writes straight to the database,
 * it does not redact.
 */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", {
      action: input.action,
      entityType: input.entityType,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }
}
