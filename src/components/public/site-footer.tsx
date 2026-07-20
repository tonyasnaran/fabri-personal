import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { LoginLink } from "@/components/public/login-link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E4DDCB]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#6B6558]">
          {siteConfig.name} &middot; &copy; {new Date().getFullYear()}
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#454135]">
          {publicNavigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#17140F]">
                {item.label}
              </Link>
            ))}
          <LoginLink className="hover:text-[#17140F]" />
        </nav>
      </div>
    </footer>
  );
}
