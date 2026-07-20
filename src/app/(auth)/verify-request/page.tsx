export default function VerifyRequestPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Check your email</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        If that address can receive sign-in emails, we&apos;ve sent a link to sign in. The link
        expires in 24 hours and can only be used once.
      </p>
      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
        Don&apos;t see it? Check your spam folder, or try again in a few minutes.
      </p>
    </div>
  );
}
