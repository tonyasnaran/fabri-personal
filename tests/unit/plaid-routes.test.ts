import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/auth/errors";

const mockRequireApiUser = vi.fn();

// Mocked without vi.importActual: the real require-user.ts imports
// @/lib/auth/config (next-auth + Prisma adapter), which pulls in modules
// that only resolve correctly under Next.js's own bundler, not plain
// Vite/Node resolution. UnauthorizedError lives in the dependency-free
// @/lib/auth/errors module specifically so it's safe to reuse here.
vi.mock("@/lib/auth/require-user", () => ({
  requireApiUser: mockRequireApiUser,
  UnauthorizedError,
}));

const { POST } = await import("@/app/api/plaid/create-link-token/route");

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/plaid/create-link-token", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/plaid/create-link-token", () => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
  });

  it("returns 401 when the caller is not authenticated", async () => {
    mockRequireApiUser.mockRejectedValue(new UnauthorizedError());

    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 501 Not Implemented for an authenticated caller (no live Plaid credentials in tests)", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "user_1", email: null, name: null });

    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(501);

    const body = await res.json();
    expect(body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
