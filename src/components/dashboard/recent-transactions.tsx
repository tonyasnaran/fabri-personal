import { EmptyState } from "@/components/ui/empty-state";
import { listRecentTransactionsForUser } from "@/server/repositories/transaction.repository";
import { formatCurrency } from "@/lib/utils/format-currency";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export async function RecentTransactions({
  userId,
  limit = 10,
  title = "Recent transactions",
}: {
  userId: string;
  limit?: number;
  title?: string;
}) {
  const transactions = await listRecentTransactionsForUser(userId, limit);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Connect a bank account to see your recent transactions here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {transactions.map((transaction) => {
            const amount = Number(transaction.amount);
            // Plaid convention: positive = money out, negative = money in.
            const isOutflow = amount > 0;

            return (
              <li
                key={transaction.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {transaction.merchantName ?? transaction.description}
                    {transaction.pending && (
                      <span className="ml-1.5 text-xs text-zinc-400">(pending)</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {transaction.financialAccount.name}
                    {transaction.financialAccount.mask
                      ? ` •••• ${transaction.financialAccount.mask}`
                      : ""}
                    {" · "}
                    {dateFormatter.format(transaction.transactionDate)}
                  </p>
                </div>
                <p
                  className={
                    isOutflow
                      ? "text-sm font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {isOutflow ? "-" : "+"}
                  {formatCurrency(Math.abs(amount), transaction.isoCurrencyCode)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
