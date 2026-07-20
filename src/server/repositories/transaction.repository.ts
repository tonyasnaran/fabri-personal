import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Repository layer for Transaction. Every query is scoped to a userId
 * supplied by the caller. `userId` is denormalized onto this table for the
 * same reason as FinancialAccount — direct scoping without a join.
 */

export type UpsertTransactionInput = {
  userId: string;
  financialAccountId: string;
  plaidTransactionId: string;
  merchantName: string | null;
  description: string;
  amount: string;
  isoCurrencyCode: string;
  transactionDate: Date;
  authorizedDate: Date | null;
  pending: boolean;
  primaryCategory: string | null;
  detailedCategory: string | null;
};

/**
 * Upserts a batch of transactions in one DB transaction. Not a true bulk
 * `ON CONFLICT` statement — Prisma's typed query builder doesn't expose one
 * — but for the transaction volumes involved here (Sandbox test data, or a
 * single person's real spending) a transaction of individual upserts is
 * simple and plenty fast.
 */
export async function upsertTransactions(transactions: UpsertTransactionInput[]): Promise<void> {
  if (transactions.length === 0) return;

  await prisma.$transaction(
    transactions.map((t) => {
      const shared = {
        userId: t.userId,
        financialAccountId: t.financialAccountId,
        merchantName: t.merchantName,
        description: t.description,
        amount: t.amount,
        isoCurrencyCode: t.isoCurrencyCode,
        transactionDate: t.transactionDate,
        authorizedDate: t.authorizedDate,
        pending: t.pending,
        primaryCategory: t.primaryCategory,
        detailedCategory: t.detailedCategory,
      };

      return prisma.transaction.upsert({
        where: { plaidTransactionId: t.plaidTransactionId },
        create: { ...shared, plaidTransactionId: t.plaidTransactionId },
        update: shared,
      });
    }),
  );
}

export async function deleteTransactionsByPlaidIds(plaidTransactionIds: string[]): Promise<void> {
  if (plaidTransactionIds.length === 0) return;
  await prisma.transaction.deleteMany({
    where: { plaidTransactionId: { in: plaidTransactionIds } },
  });
}

export function listRecentTransactionsForUser(userId: string, limit = 10) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { financialAccount: { select: { name: true, mask: true } } },
  });
}

/**
 * Income/spending totals for the calendar month containing `referenceDate`.
 * Follows Plaid's amount convention: positive = money out (spending),
 * negative = money in (income). Pending transactions are excluded since
 * their amount/category can still change before settling.
 */
export async function getMonthlySummaryForUser(userId: string, referenceDate: Date = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: start, lt: end }, pending: false },
    select: { amount: true },
  });

  let income = 0;
  let spending = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    if (amount > 0) {
      spending += amount;
    } else {
      income += Math.abs(amount);
    }
  }

  return { income, spending };
}

/** Top spending categories for the calendar month containing `referenceDate`, largest first. */
export async function getSpendingByCategoryForUser(
  userId: string,
  referenceDate: Date = new Date(),
  limit = 5,
) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: start, lt: end },
      pending: false,
      amount: { gt: 0 }, // outflows only
    },
    select: { amount: true, primaryCategory: true },
  });

  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const category = transaction.primaryCategory ?? "Uncategorized";
    totals.set(category, (totals.get(category) ?? 0) + Number(transaction.amount));
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
