"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publicNavigation } from "@/config/navigation";

export function MobileMenu({ loginSlot }: { loginSlot: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-px w-5 bg-[#17140F] transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-5 bg-[#17140F] transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col justify-center gap-8 bg-[#F7F4EC] px-8 transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-6">
          {publicNavigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
              className={`font-[family-name:var(--font-fraunces)] text-4xl text-[#17140F] transition-all duration-300 ease-out ${
                open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div onClick={() => setOpen(false)} className="text-sm font-medium text-[#17140F]">
          {loginSlot}
        </div>
      </div>
    </div>
  );
}
