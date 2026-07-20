import { ChartContainer } from "@/components/dashboard/chart-container";
import { EmptyState } from "@/components/ui/empty-state";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Spending trends and AI-generated insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer title="Spending by category">
          <EmptyState
            title="No data yet"
            description="Categorized spending will appear here once transactions sync."
          />
        </ChartContainer>
        <ChartContainer title="Income vs. spending">
          <EmptyState
            title="No data yet"
            description="This comparison will appear here once transactions sync."
          />
        </ChartContainer>
      </div>

      <ChartContainer title="AI-generated insights" description="Coming in a future task">
        <EmptyState
          title="Not available yet"
          description="Financial insights will be generated once account data is available."
        />
      </ChartContainer>
    </div>
  );
}
