import "server-only";
import type { AccountBase, Transaction as PlaidTransaction } from "plaid";
import type { AccountType } from "@/generated/prisma/client";
import type { UpsertFinancialAccountInput } from "@/server/repositories/financial-account.repository";
import type { UpsertTransactionInput } from "@/server/repositories/transaction.repository";

const PLAID_ACCOUNT_TYPE_MAP: Record<string, AccountType> = {
  depository: "DEPOSITORY",
  credit: "CREDIT",
  loan: "LOAN",
  investment: "INVESTMENT",
  // Plaid's "brokerage" predates the introduction of "investment" as a
  // distinct type; our schema doesn't distinguish the two.
  brokerage: "INVESTMENT",
  other: "OTHER",
};

export function mapPlaidAccountType(plaidType: string): AccountType {
  return PLAID_ACCOUNT_TYPE_MAP[plaidType] ?? "OTHER";
}

export function mapPlaidAccountToInput(
  account: AccountBase,
  userId: string,
  financialConnectionId: string,
): UpsertFinancialAccountInput {
  return {
    userId,
    financialConnectionId,
    plaidAccountId: account.account_id,
    name: account.name,
    officialName: account.official_name,
    type: mapPlaidAccountType(account.type),
    subtype: account.subtype,
    mask: account.mask,
    currentBalance: (account.balances.current ?? 0).toFixed(4),
    availableBalance:
      account.balances.available !== null ? account.balances.available.toFixed(4) : null,
    isoCurrencyCode: account.balances.iso_currency_code ?? "USD",
  };
}

export function mapPlaidTransactionToInput(
  transaction: PlaidTransaction,
  userId: string,
  financialAccountId: string,
): UpsertTransactionInput {
  return {
    userId,
    financialAccountId,
    plaidTransactionId: transaction.transaction_id,
    merchantName: transaction.merchant_name ?? null,
    description: transaction.merchant_name ?? transaction.name ?? "Transaction",
    amount: transaction.amount.toFixed(4),
    isoCurrencyCode: transaction.iso_currency_code ?? "USD",
    transactionDate: new Date(transaction.date),
    authorizedDate: transaction.authorized_date ? new Date(transaction.authorized_date) : null,
    pending: transaction.pending,
    primaryCategory: transaction.personal_finance_category?.primary ?? null,
    detailedCategory: transaction.personal_finance_category?.detailed ?? null,
  };
}
