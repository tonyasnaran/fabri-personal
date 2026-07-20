/**
 * Deliberately dependency-free (no Plaid SDK, Prisma, or repository
 * imports) so these can be imported in tests without dragging in the full
 * plaid-service.ts dependency chain — same reasoning as
 * src/lib/auth/errors.ts.
 */

export class PlaidNotConfiguredError extends Error {
  constructor(message = "Plaid is not configured") {
    super(message);
    this.name = "PlaidNotConfiguredError";
  }
}

export class PlaidResourceNotFoundError extends Error {
  constructor(message = "Financial connection not found") {
    super(message);
    this.name = "PlaidResourceNotFoundError";
  }
}
