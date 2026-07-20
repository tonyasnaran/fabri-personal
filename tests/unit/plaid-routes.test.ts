import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/auth/errors";
import { __resetRateLimitersForTests } from "@/lib/security/rate-limit";

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

// Dynamic (not static) imports: a static `import ... from ".../route"` is
// evaluated before this file's own top-level `const mockRequireApiUser`
// statement runs (per the ES module execution order), which would make the
// mock factory above throw a TDZ error the moment route.ts imports
// @/lib/auth/require-user. Deferring via `await import()` guarantees
// mockRequireApiUser exists first.
const { POST: createLinkTokenPOST } = await import("@/app/api/plaid/create-link-token/route");
const { POST: exchangePublicTokenPOST } =
  await import("@/app/api/plaid/exchange-public-token/route");
const { POST: syncTransactionsPOST } = await import("@/app/api/plaid/sync-transactions/route");

const routes = [
  {
    name: "create-link-token",
    handler: createLinkTokenPOST,
    url: "http://localhost:3000/api/plaid/create-link-token",
  },
  {
    name: "exchange-public-token",
    handler: exchangePublicTokenPOST,
    url: "http://localhost:3000/api/plaid/exchange-public-token",
    body: { publicToken: "public-sandbox-token" },
  },
  {
    name: "sync-transactions",
    handler: syncTransactionsPOST,
    url: "http://localhost:3000/api/plaid/sync-transactions",
    body: { financialConnectionId: "conn_1" },
  },
];

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    headers: { "content-type": "application/json" },
  });
}

describe.each(routes)("POST /api/plaid/$name", ({ handler, url, body }) => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
    __resetRateLimitersForTests();
  });

  it("returns 401 when the caller is not authenticated", async () => {
    mockRequireApiUser.mockRejectedValue(new UnauthorizedError());

    const res = await handler(jsonRequest(url, body));
    expect(res.status).toBe(401);

    const responseBody = await res.json();
    expect(responseBody.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 501 Not Implemented for an authenticated caller (no live Plaid credentials in tests)", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "user_1", email: null, name: null });

    const res = await handler(jsonRequest(url, body));
    expect(res.status).toBe(501);

    const responseBody = await res.json();
    expect(responseBody.error.code).toBe("NOT_IMPLEMENTED");
  });

  it("uses the trusted session id, ignoring any userId in the request body", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "trusted_session_user", email: null, name: null });

    // A malicious/naive client-supplied userId in the body must have no effect.
    const res = await handler(jsonRequest(url, { ...body, userId: "someone-elses-id" }));

    // Still 501 (not implemented), never a validation error from the extra
    // field, and specifically never anything that would imply the body's
    // userId was accepted as the authorization identity.
    expect(res.status).toBe(501);
  });

  it("returns 429 once the sensitive-endpoint rate limit is exceeded", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "rate_limited_user", email: null, name: null });

    let last;
    for (let i = 0; i < 21; i++) {
      last = await handler(jsonRequest(url, body));
    }

    expect(last?.status).toBe(429);
    const responseBody = await last?.json();
    expect(responseBody.error.code).toBe("RATE_LIMITED");
  });
});
