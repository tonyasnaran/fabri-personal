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
