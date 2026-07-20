"use client";

import { useState } from "react";
import { dashboardNavigation } from "@/config/navigation";
import { NavLink } from "@/components/layout/nav-link";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        className="rounded-lg border border-zinc-300 p-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen && (
        <nav className="absolute inset-x-0 top-[65px] z-10 flex flex-col gap-1 border-b border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {dashboardNavigation.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={() => setIsOpen(false)} />
          ))}
        </nav>
      )}
    </div>
  );
}
