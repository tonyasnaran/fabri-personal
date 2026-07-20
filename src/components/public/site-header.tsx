import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { LoginLink } from "@/components/public/login-link";
import { MobileMenu } from "@/components/public/mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E4DDCB] bg-[#F7F4EC]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-lg tracking-tight text-[#17140F]"
        >
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-sm text-[#454135] transition-colors hover:text-[#17140F]"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#17140F] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <LoginLink className="rounded-full bg-[#17140F] px-4 py-2 text-sm font-medium text-[#F7F4EC] transition-colors hover:bg-[#322C22]" />
        </nav>

        <MobileMenu loginSlot={<LoginLink />} />
      </div>
    </header>
  );
}
