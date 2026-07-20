import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { UnauthorizedError } from "@/lib/auth/errors";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export { UnauthorizedError };

async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

/**
 * Server-side guard for Server Components (layouts/pages). Redirects
 * unauthenticated users to /sign-in. This is the authoritative check for
 * `/dashboard` — navigation links being hidden is not sufficient on its
 * own, every dashboard layout must call this.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

/**
 * Server-side guard for Route Handlers. Throws instead of redirecting so
 * the handler can catch it and return a proper 401 JSON response via
 * `unauthorizedResponse()`.
 */
export async function requireApiUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
