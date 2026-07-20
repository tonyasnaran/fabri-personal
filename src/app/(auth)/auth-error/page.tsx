import Link from "next/link";
import { getAuthErrorHeading, getAuthErrorMessage } from "@/lib/auth/error-messages";
import { recordAuditEvent } from "@/lib/security/audit";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // "Failed sign-in" audit trail. Only the safe Auth.js error code is
  // recorded — never a raw provider/database error body.
  if (error) {
    await recordAuditEvent({
      action: "auth.sign_in_failed",
      entityType: "User",
      metadata: { code: error },
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {getAuthErrorHeading(error)}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{getAuthErrorMessage(error)}</p>
      <Link
        href="/sign-in"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Back to sign in
      </Link>
    </div>
  );
}
