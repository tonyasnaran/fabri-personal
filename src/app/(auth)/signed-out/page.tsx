import Link from "next/link";

export default function SignedOutPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        You&apos;ve been signed out
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Your session has ended. Sign in again to access your dashboard.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
