import { requireUser } from "@/lib/auth/require-user";
import { ConnectedAccounts } from "@/components/dashboard/connected-accounts";

export default async function AccountsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Accounts</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Bank accounts connected through Plaid.
        </p>
      </div>
      <ConnectedAccounts userId={user.id} />
    </div>
  );
}
