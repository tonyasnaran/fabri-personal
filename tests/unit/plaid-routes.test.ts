import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/auth/errors";
import {
  PlaidNotConfiguredError,
  PlaidResourceNotFoundError,
} from "@/server/services/plaid-errors";
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

// Mocked for the same reason: the real plaid-service.ts pulls in Prisma
// (via its repositories and the audit logger), which needs a live
// DATABASE_URL this test suite deliberately doesn't provide. Route-level
// behavior (auth, validation, rate limiting, error-to-status mapping) is
// what these tests cover; plaid-service.test.ts covers the real service
// logic against a mocked Plaid client instead.
const mockCreateLinkToken = vi.fn();
const mockExchangePublicToken = vi.fn();
const mockSyncTransactions = vi.fn();
vi.mock("@/server/services/plaid-service", () => ({
  createLinkToken: (...args: unknown[]) => mockCreateLinkToken(...args),
  exchangePublicToken: (...args: unknown[]) => mockExchangePublicToken(...args),
  syncTransactions: (...args: unknown[]) => mockSyncTransactions(...args),
  PlaidNotConfiguredError,
  PlaidResourceNotFoundError,
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
    serviceMock: mockCreateLinkToken,
    url: "http://localhost:3000/api/plaid/create-link-token",
  },
  {
    name: "exchange-public-token",
    handler: exchangePublicTokenPOST,
    serviceMock: mockExchangePublicToken,
    url: "http://localhost:3000/api/plaid/exchange-public-token",
    body: { publicToken: "public-sandbox-token" },
  },
  {
    name: "sync-transactions",
    handler: syncTransactionsPOST,
    serviceMock: mockSyncTransactions,
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

describe.each(routes)("POST /api/plaid/$name", ({ handler, serviceMock, url, body }) => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
    serviceMock.mockReset();
    __resetRateLimitersForTests();
  });

  it("returns 401 when the caller is not authenticated", async () => {
    mockRequireApiUser.mockRejectedValue(new UnauthorizedError());

    const res = await handler(jsonRequest(url, body));
    expect(res.status).toBe(401);

    const responseBody = await res.json();
    expect(responseBody.error.code).toBe("UNAUTHORIZED");
    expect(serviceMock).not.toHaveBeenCalled();
  });

  it("forwards a successful service response for an authenticated caller", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "user_1", email: null, name: null });
    serviceMock.mockResolvedValue({ ok: true });

    const res = await handler(jsonRequest(url, body));
    expect(res.status).toBe(200);

    const responseBody = await res.json();
    expect(responseBody.data).toEqual({ ok: true });
  });

  it("returns 501 when the service reports Plaid isn't configured", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "user_1", email: null, name: null });
    serviceMock.mockRejectedValue(new PlaidNotConfiguredError());

    const res = await handler(jsonRequest(url, body));
    expect(res.status).toBe(501);
  });

  it("uses the trusted session id, ignoring any userId in the request body", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "trusted_session_user", email: null, name: null });
    serviceMock.mockResolvedValue({ ok: true });

    // A malicious/naive client-supplied userId in the body must have no effect.
    await handler(jsonRequest(url, { ...body, userId: "someone-elses-id" }));

    const [calledUserId] = serviceMock.mock.calls[0]!;
    expect(calledUserId).toBe("trusted_session_user");
  });

  it("returns 429 once the sensitive-endpoint rate limit is exceeded", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "rate_limited_user", email: null, name: null });
    serviceMock.mockResolvedValue({ ok: true });

    let last;
    for (let i = 0; i < 21; i++) {
      last = await handler(jsonRequest(url, body));
    }

    expect(last?.status).toBe(429);
    const responseBody = await last?.json();
    expect(responseBody.error.code).toBe("RATE_LIMITED");
  });
});

describe("POST /api/plaid/sync-transactions — resource ownership", () => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
    mockSyncTransactions.mockReset();
    __resetRateLimitersForTests();
  });

  it("returns 404 when the connection doesn't belong to the caller", async () => {
    mockRequireApiUser.mockResolvedValue({ id: "user_1", email: null, name: null });
    mockSyncTransactions.mockRejectedValue(new PlaidResourceNotFoundError());

    const res = await syncTransactionsPOST(
      jsonRequest("http://localhost:3000/api/plaid/sync-transactions", {
        financialConnectionId: "someone_elses_connection",
      }),
    );
    expect(res.status).toBe(404);
  });
});
