import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Repository layer for TransactionSyncState. Not user-scoped directly —
 * always reached through a FinancialConnection whose ownership has already
 * been verified by the caller (see plaid-service.ts).
 */

export function getSyncState(financialConnectionId: string) {
  return prisma.transactionSyncState.findUnique({
    where: { financialConnectionId },
  });
}

export function upsertSyncStateSuccess(financialConnectionId: string, cursor: string) {
  return prisma.transactionSyncState.upsert({
    where: { financialConnectionId },
    create: {
      financialConnectionId,
      cursor,
      lastSuccessfulSyncAt: new Date(),
      lastSyncError: null,
    },
    update: {
      cursor,
      lastSuccessfulSyncAt: new Date(),
      lastSyncError: null,
    },
  });
}

export function upsertSyncStateError(financialConnectionId: string, errorMessage: string) {
  return prisma.transactionSyncState.upsert({
    where: { financialConnectionId },
    create: {
      financialConnectionId,
      lastSyncError: errorMessage,
    },
    update: {
      lastSyncError: errorMessage,
    },
  });
}
