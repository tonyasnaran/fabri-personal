import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { ConnectionStatus } from "@/generated/prisma/client";

/**
 * Repository layer for FinancialConnection. Every user-facing query is
 * scoped to a userId supplied by the caller — callers must always source
 * that id from the authenticated session (`requireApiUser()`), never from a
 * request body or query string.
 *
 * The one exception is `getFinancialConnectionByPlaidItemId`, used only by
 * webhook processing: Plaid webhooks have no user session, so lookup is by
 * Plaid's own unique item id instead. The row returned already carries the
 * correct `userId`, which the caller then uses for every subsequent scoped
 * operation — this function itself never trusts caller-supplied identity.
 */

export type CreateFinancialConnectionInput = {
  userId: string;
  plaidItemId: string;
  encryptedAccessToken: string;
  institutionId: string | null;
  institutionName: string | null;
};

export function createFinancialConnection(input: CreateFinancialConnectionInput) {
  return prisma.financialConnection.create({
    data: {
      userId: input.userId,
      plaidItemId: input.plaidItemId,
      encryptedAccessToken: input.encryptedAccessToken,
      institutionId: input.institutionId,
      institutionName: input.institutionName,
    },
  });
}

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

/** Webhook-only lookup — see module doc comment above. */
export function getFinancialConnectionByPlaidItemId(plaidItemId: string) {
  return prisma.financialConnection.findUnique({
    where: { plaidItemId },
  });
}

export function updateFinancialConnectionStatus(connectionId: string, status: ConnectionStatus) {
  return prisma.financialConnection.update({
    where: { id: connectionId },
    data: { status },
  });
}

/**
 * Fully removes a connection and (via cascade) its accounts, transactions,
 * and sync state. Callers must revoke the item at Plaid (`itemRemove`)
 * *before* calling this — see plaid-service.ts's `disconnectConnection`.
 */
export function deleteFinancialConnectionForUser(userId: string, connectionId: string) {
  return prisma.financialConnection.deleteMany({
    where: { id: connectionId, userId },
  });
}
