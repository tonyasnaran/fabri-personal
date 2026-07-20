import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { AccountType } from "@/generated/prisma/client";

/**
 * Repository layer for FinancialAccount. Every query is scoped to a userId
 * supplied by the caller — see financial-connection.repository.ts for the
 * same rule. `userId` is denormalized onto this table specifically so
 * queries here never need to join through FinancialConnection to enforce
 * ownership.
 */

export type UpsertFinancialAccountInput = {
  userId: string;
  financialConnectionId: string;
  plaidAccountId: string;
  name: string;
  officialName: string | null;
  type: AccountType;
  subtype: string | null;
  mask: string | null;
  currentBalance: string;
  availableBalance: string | null;
  isoCurrencyCode: string;
};

export function upsertFinancialAccount(input: UpsertFinancialAccountInput) {
  const shared = {
    userId: input.userId,
    financialConnectionId: input.financialConnectionId,
    name: input.name,
    officialName: input.officialName,
    type: input.type,
    subtype: input.subtype,
    mask: input.mask,
    currentBalance: input.currentBalance,
    availableBalance: input.availableBalance,
    isoCurrencyCode: input.isoCurrencyCode,
    lastSyncedAt: new Date(),
  };

  return prisma.financialAccount.upsert({
    where: { plaidAccountId: input.plaidAccountId },
    create: { ...shared, plaidAccountId: input.plaidAccountId },
    update: shared,
  });
}

export function listFinancialAccountsForUser(userId: string) {
  return prisma.financialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Balance totals across all of a user's accounts.
 * - `totalBalance`: sum of asset accounts (depository/investment/other) —
 *   "what you have."
 * - `netWorth`: `totalBalance` minus liabilities (credit/loan balances) —
 *   "what you're actually worth."
 */
export async function getBalanceSummaryForUser(userId: string) {
  const accounts = await prisma.financialAccount.findMany({
    where: { userId },
    select: { type: true, currentBalance: true },
  });

  let assets = 0;
  let liabilities = 0;

  for (const account of accounts) {
    const balance = Number(account.currentBalance);
    if (account.type === "CREDIT" || account.type === "LOAN") {
      liabilities += balance;
    } else {
      assets += balance;
    }
  }

  return {
    totalBalance: assets,
    netWorth: assets - liabilities,
    accountCount: accounts.length,
  };
}
