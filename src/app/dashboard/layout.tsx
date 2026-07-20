import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

/**
 * Authoritative server-side auth check for every /dashboard route.
 * src/proxy.ts also redirects unauthenticated requests for fast UX, but
 * this call is the real enforcement point per Next.js's guidance that
 * Proxy coverage can silently regress — never remove it.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav user={user} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
