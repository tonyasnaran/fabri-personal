import { EmptyState } from "@/components/ui/empty-state";
import { PlaidLinkButton } from "@/components/dashboard/plaid-link-button";
import { listFinancialAccountsForUser } from "@/server/repositories/financial-account.repository";
import { isPlaidConfigured } from "@/lib/plaid/config";
import { formatCurrency } from "@/lib/utils/format-currency";

export async function ConnectedAccounts({ userId }: { userId: string }) {
  const accounts = await listFinancialAccountsForUser(userId);
  const plaidReady = isPlaidConfigured();

  const connectAction = plaidReady ? (
    <PlaidLinkButton />
  ) : (
    <button
      type="button"
      disabled
      title="Plaid is not configured in this environment yet"
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
    >
      Connect an account
    </button>
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Connected accounts
        </h3>
        {accounts.length > 0 && connectAction}
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts connected"
          description="Securely connect a bank account with Plaid to see balances here."
          action={connectAction}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {account.name}
                  {account.mask && (
                    <span className="ml-1.5 text-xs text-zinc-400">•••• {account.mask}</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {account.type.charAt(0) + account.type.slice(1).toLowerCase()}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(Number(account.currentBalance), account.isoCurrencyCode)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
