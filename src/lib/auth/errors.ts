/**
 * Deliberately dependency-free (no next-auth/Prisma imports) so it can be
 * imported in tests without dragging in the full Auth.js config chain.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Thrown by assertResourceOwner() when a resource belongs to a different user. */
export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}
