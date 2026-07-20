import type { CSSProperties, ReactNode } from "react";
import "@fontsource-variable/fraunces/full.css";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { SkipLink } from "@/components/public/skip-link";

const frauncesVariable = {
  "--font-fraunces": "'Fraunces Variable', ui-serif, Georgia, serif",
} as CSSProperties;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={frauncesVariable}
      className="flex min-h-screen flex-col bg-[#F7F4EC] text-[#17140F]"
    >
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
