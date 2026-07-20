import { MetricCard } from "@/components/dashboard/metric-card";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ConnectedAccounts } from "@/components/dashboard/connected-accounts";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your financial snapshot. Connect an account to populate these numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Net worth" value="—" hint="No accounts connected" />
        <MetricCard label="Total balance" value="—" hint="No accounts connected" />
        <MetricCard label="Monthly income" value="—" hint="No transactions yet" />
        <MetricCard label="Monthly spending" value="—" hint="No transactions yet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Net worth over time"
          description="Tracks account balances over the last 12 months"
        >
          <EmptyState
            title="Nothing to show yet"
            description="This chart will populate once you connect a bank account."
          />
        </ChartContainer>
        <ChartContainer title="Spending overview" description="Spending by category this month">
          <EmptyState
            title="Nothing to show yet"
            description="This chart will populate once transactions start syncing."
          />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConnectedAccounts />
        <RecentTransactions />
      </div>
    </div>
  );
}
