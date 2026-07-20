import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Repository layer for FinancialConnection. Every query is scoped to a
 * userId supplied by the caller — callers must always source that id from
 * the authenticated session (`requireApiUser()`), never from a request body
 * or query string.
 */

export function listFinancialConnectionsForUser(userId: string) {
  return prisma.financialConnection.findMany({
    where: { userId },
    include: { financialAccounts: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getFinancialConnectionForUser(userId: string, connectionId: string) {
  return prisma.financialConnection.findFirst({
    where: { id: connectionId, userId },
  });
}

/** Marks a connection disconnected rather than deleting it, preserving audit history. */
export function disconnectFinancialConnectionForUser(userId: string, connectionId: string) {
  return prisma.financialConnection.updateMany({
    where: { id: connectionId, userId },
    data: { status: "DISCONNECTED" },
  });
}
