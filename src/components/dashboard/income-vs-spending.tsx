import { EmptyState } from "@/components/ui/empty-state";
import { getMonthlySummaryForUser } from "@/server/repositories/transaction.repository";
import { formatCurrency } from "@/lib/utils/format-currency";

export async function IncomeVsSpending({ userId }: { userId: string }) {
  const { income, spending } = await getMonthlySummaryForUser(userId);

  if (income === 0 && spending === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        description="This will populate once transactions start syncing."
      />
    );
  }

  const maxAmount = Math.max(income, spending, 1);

  const rows = [
    { label: "Income", amount: income, barClassName: "bg-emerald-500 dark:bg-emerald-400" },
    { label: "Spending", amount: spending, barClassName: "bg-zinc-900 dark:bg-zinc-100" },
  ];

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{row.label}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(row.amount)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-1.5 rounded-full ${row.barClassName}`}
              style={{ width: `${(row.amount / maxAmount) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
