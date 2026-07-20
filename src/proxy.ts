import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

/**
 * Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`
 * (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 * The exported function must be named `proxy` (or be the default export).
 *
 * This only provides a fast, unauthenticated-user redirect for UX. It is
 * NOT the sole enforcement point — every dashboard layout and API route
 * also calls `requireUser()` / `requireApiUser()` server-side, per Next.js's
 * own guidance that Proxy coverage can silently regress if a route moves.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (!session?.user) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
