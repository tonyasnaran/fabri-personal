import { EmptyState } from "@/components/ui/empty-state";

/** TODO(next-task): list real FinancialAccount rows once Plaid Link is implemented. */
export function ConnectedAccounts() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Connected accounts
      </h3>
      <EmptyState
        title="No accounts connected"
        description="Securely connect a bank account with Plaid to see balances here."
        action={
          <button
            type="button"
            disabled
            title="Plaid integration is not implemented yet"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Connect an account
          </button>
        }
      />
    </div>
  );
}
