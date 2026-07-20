import { dashboardNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { NavLink } from "@/components/layout/nav-link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {siteConfig.name}
      </div>
      <nav className="mt-8 flex flex-col gap-1">
        {dashboardNavigation.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
