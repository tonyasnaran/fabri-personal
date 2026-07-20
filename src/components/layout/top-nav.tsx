import { signOut } from "@/lib/auth/config";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { AuthenticatedUser } from "@/lib/auth/require-user";

export function TopNav({ user }: { user: AuthenticatedUser }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 md:px-8 dark:border-zinc-800 dark:bg-zinc-950">
      <MobileNav />
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {user.name ?? user.email ?? "Signed in"}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
