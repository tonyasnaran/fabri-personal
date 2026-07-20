export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem persists, contact support.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-900 dark:text-red-300">{title}</p>
      <p className="max-w-sm text-sm text-red-700 dark:text-red-400">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
        >
          Try again
        </button>
      )}
    </div>
  );
}
