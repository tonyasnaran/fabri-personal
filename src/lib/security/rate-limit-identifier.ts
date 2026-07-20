import "server-only";
import { createHash } from "node:crypto";
import { normalizeEmail } from "@/lib/auth/normalize-email";

/**
 * Rate-limit identifiers are one-way hashes, never the raw value — so a
 * rate-limit store dump (in-memory or, later, Redis) never contains a
 * usable email address, and it never ends up in a log line either.
 */
function hashForRateLimit(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Identifier for email-based rate limits (magic-link requests). */
export function emailRateLimitId(email: string): string {
  return `email:${hashForRateLimit(normalizeEmail(email))}`;
}

/** Identifier derived from the client IP, when available behind a proxy. */
export function ipRateLimitId(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return `ip:${hashForRateLimit(ip && ip.length > 0 ? ip : "unknown")}`;
}

/** Identifier for per-user limits on authenticated endpoints. */
export function userRateLimitId(userId: string): string {
  return `user:${userId}`;
}
