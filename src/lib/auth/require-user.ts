import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/errors";
import { recordAuditEvent } from "@/lib/security/audit";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export { UnauthorizedError, ForbiddenError };

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
    await recordAuditEvent({
      action: "auth.unauthorized_dashboard_access",
      entityType: "Dashboard",
    });
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
    await recordAuditEvent({
      action: "auth.unauthorized_api_access",
      entityType: "Route",
    });
    throw new UnauthorizedError();
  }
  return user;
}

/**
 * Convenience wrapper for Route Handlers and Server Actions that only need
 * the trusted internal user id, not the full profile. Never derive this id
 * from a query parameter, form field, header, or request body instead —
 * this is the one source of truth for "who is making this request."
 */
export async function requireUserId(): Promise<string> {
  const user = await requireApiUser();
  return user.id;
}

/**
 * Non-throwing session read for pages/components that render differently
 * for signed-in vs. anonymous visitors (e.g. the public homepage) but
 * don't need to gate access. Does not redirect and does not audit-log —
 * use requireUser()/requireApiUser() wherever access is actually gated.
 */
export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  return getSessionUser();
}

/**
 * Authorization check for a resource already fetched by id: confirms its
 * owner matches the authenticated user before the caller acts on it.
 * Throws ForbiddenError (mapped to a 403) rather than returning a boolean,
 * so callers can't accidentally ignore the result.
 */
export function assertResourceOwner(
  userId: string,
  resourceOwnerId: string | null | undefined,
): void {
  if (!resourceOwnerId || resourceOwnerId !== userId) {
    throw new ForbiddenError();
  }
}
