import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A full history of transactions across connected accounts.
        </p>
      </div>
      <RecentTransactions />
    </div>
  );
}
