import { requireUser } from "@/lib/auth/require-user";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ConnectedAccounts } from "@/components/dashboard/connected-accounts";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { EmptyState } from "@/components/ui/empty-state";
import { getBalanceSummaryForUser } from "@/server/repositories/financial-account.repository";
import { getMonthlySummaryForUser } from "@/server/repositories/transaction.repository";
import { formatCurrency } from "@/lib/utils/format-currency";

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const [balances, monthly] = await Promise.all([
    getBalanceSummaryForUser(user.id),
    getMonthlySummaryForUser(user.id),
  ]);

  const hasAccounts = balances.accountCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your financial snapshot. Connect an account to populate these numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Net worth"
          value={hasAccounts ? formatCurrency(balances.netWorth) : "—"}
          hint={hasAccounts ? undefined : "No accounts connected"}
        />
        <MetricCard
          label="Total balance"
          value={hasAccounts ? formatCurrency(balances.totalBalance) : "—"}
          hint={hasAccounts ? undefined : "No accounts connected"}
        />
        <MetricCard
          label="Monthly income"
          value={hasAccounts ? formatCurrency(monthly.income) : "—"}
          hint={hasAccounts ? "This month" : "No transactions yet"}
        />
        <MetricCard
          label="Monthly spending"
          value={hasAccounts ? formatCurrency(monthly.spending) : "—"}
          hint={hasAccounts ? "This month" : "No transactions yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Net worth over time"
          description="Tracks account balances over the last 12 months"
        >
          <EmptyState
            title="Coming soon"
            description="Historical balance tracking isn't implemented yet — this shows your current snapshot only."
          />
        </ChartContainer>
        <ChartContainer title="Spending overview" description="Spending by category this month">
          <SpendingByCategory userId={user.id} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConnectedAccounts userId={user.id} />
        <RecentTransactions userId={user.id} />
      </div>
    </div>
  );
}
