import { EmptyState } from "@/components/ui/empty-state";

/** TODO(next-task): fetch real transactions once Plaid sync is implemented. */
export function RecentTransactions() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Recent transactions
      </h3>
      <EmptyState
        title="No transactions yet"
        description="Connect a bank account to see your recent transactions here."
      />
    </div>
  );
}
