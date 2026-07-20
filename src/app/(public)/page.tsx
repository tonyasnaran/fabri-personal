import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hi, I&apos;m</p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
        {siteConfig.title}
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">{siteConfig.tagline}</p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/about"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          About me
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
