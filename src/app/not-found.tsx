import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">404</h1>
      <p className="text-zinc-600 dark:text-zinc-400">This page could not be found.</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Back home
      </Link>
    </div>
  );
}
