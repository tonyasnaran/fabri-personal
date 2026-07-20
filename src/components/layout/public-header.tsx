import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function PublicHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-6">
          {publicNavigation.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
