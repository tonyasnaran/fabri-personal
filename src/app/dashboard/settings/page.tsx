import { requireUser } from "@/lib/auth/require-user";
import { signOut } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  listFinancialConnectionsForUser,
  disconnectFinancialConnectionForUser,
} from "@/server/repositories/financial-connection.repository";
import { logger } from "@/lib/security/logger";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SettingsPage() {
  const user = await requireUser();
  const connections = await listFinancialConnectionsForUser(user.id);

  async function disconnectAction(formData: FormData) {
    "use server";
    const currentUser = await requireUser();
    const connectionId = String(formData.get("connectionId") ?? "");
    if (!connectionId) return;

    await disconnectFinancialConnectionForUser(currentUser.id, connectionId);
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "financial_connection.disconnect",
        entityType: "FinancialConnection",
        entityId: connectionId,
      },
    });
    logger.info("financial_connection.disconnected", { userId: currentUser.id, connectionId });
  }

  async function deleteAccountAction() {
    "use server";
    const currentUser = await requireUser();

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "user.delete_requested",
        entityType: "User",
        entityId: currentUser.id,
      },
    });
    logger.info("user.delete_requested", { userId: currentUser.id });

    // Cascades to Account, Session, FinancialConnection (and its
    // FinancialAccount/TransactionSyncState rows) per the Prisma schema.
    // AuditLog rows are preserved with userId set to null (onDelete: SetNull).
    await prisma.user.delete({ where: { id: currentUser.id } });
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile, connected accounts, and data.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profile</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{user.email ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Connected accounts
        </h2>
        <div className="mt-4">
          {connections.length === 0 ? (
            <EmptyState
              title="No connections to manage"
              description="Once you connect a bank account, you can disconnect it here at any time."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {connections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {connection.institutionName ?? "Connected institution"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Status: {connection.status}
                    </p>
                  </div>
                  <form action={disconnectAction}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Disconnect
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/10">
        <h2 className="text-sm font-semibold text-red-900 dark:text-red-300">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
          Permanently delete your account and all associated data, including connected accounts and
          transactions. This cannot be undone.
        </p>
        <form action={deleteAccountAction} className="mt-4">
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete my account
          </button>
        </form>
      </section>
    </div>
  );
}
