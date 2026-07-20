import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex gap-4">
          <a href={siteConfig.links.github} className="hover:text-zinc-900 dark:hover:text-zinc-50">
            GitHub
          </a>
          <a
            href={siteConfig.links.linkedin}
            className="hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            LinkedIn
          </a>
          <a href={siteConfig.links.email} className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
