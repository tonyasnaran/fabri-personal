/**
 * Normalizes an email address for consistent lookup, storage, and rate
 * limiting: trims whitespace and lowercases it. Deliberately dependency-free
 * so it's safe to use from both server and client-adjacent code (e.g. a
 * server action) without pulling in the Auth.js config chain.
 *
 * Note: only the ASCII-safe lowercase transform is applied to the whole
 * address (not just the domain) — this matches what most mailbox providers
 * treat as equivalent in practice and is what Auth.js's own default email
 * normalization does. It is a pragmatic simplification, not a full RFC 5321
 * implementation (which would only lowercase the domain).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
