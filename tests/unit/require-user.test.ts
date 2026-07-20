import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockRecordAuditEvent = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: mockAuth,
}));

// require-user.ts also writes an audit event on the unauthenticated path;
// mocked here (rather than letting the real module run) because the real
// implementation imports the Prisma client, which needs a live DATABASE_URL
// this test suite deliberately doesn't provide.
vi.mock("@/lib/security/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const {
  requireUser,
  requireApiUser,
  requireUserId,
  getOptionalUser,
  assertResourceOwner,
  UnauthorizedError,
  ForbiddenError,
} = await import("@/lib/auth/require-user");

describe("requireUser (Server Component guard)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRecordAuditEvent.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in");
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.unauthorized_dashboard_access" }),
    );
  });

  it("redirects to /sign-in when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("returns the authenticated user when a session exists", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "user@example.com", name: "Test User" },
    });

    const user = await requireUser();
    expect(user).toEqual({ id: "user_1", email: "user@example.com", name: "Test User" });
  });
});

describe("requireApiUser (Route Handler guard)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRecordAuditEvent.mockReset();
  });

  it("throws UnauthorizedError when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireApiUser()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.unauthorized_api_access" }),
    );
  });

  it("returns the authenticated user when a session exists", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_2", email: null, name: null } });
    const user = await requireApiUser();
    expect(user.id).toBe("user_2");
  });
});

describe("requireUserId", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRecordAuditEvent.mockReset();
  });

  it("returns just the trusted internal id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_3", email: null, name: null } });
    await expect(requireUserId()).resolves.toBe("user_3");
  });

  it("throws UnauthorizedError, not a redirect, when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUserId()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("getOptionalUser", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("returns null (not a redirect/throw) when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getOptionalUser()).resolves.toBeNull();
  });

  it("returns the user when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_4", email: "u@example.com", name: "U" } });
    await expect(getOptionalUser()).resolves.toEqual({
      id: "user_4",
      email: "u@example.com",
      name: "U",
    });
  });

  it("only ever maps id/email/name — never leaks extra session fields", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user_5",
        email: "u@example.com",
        name: "U",
        // Simulates something unexpected sneaking onto the session object.
        accessToken: "should-never-surface",
      },
    });

    const user = await getOptionalUser();
    expect(user).toEqual({ id: "user_5", email: "u@example.com", name: "U" });
    expect(user).not.toHaveProperty("accessToken");
  });
});

describe("assertResourceOwner", () => {
  it("does not throw when the resource belongs to the authenticated user", () => {
    expect(() => assertResourceOwner("user_1", "user_1")).not.toThrow();
  });

  it("throws ForbiddenError when the resource belongs to a different user", () => {
    expect(() => assertResourceOwner("user_1", "user_2")).toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when the resource has no owner", () => {
    expect(() => assertResourceOwner("user_1", null)).toThrow(ForbiddenError);
    expect(() => assertResourceOwner("user_1", undefined)).toThrow(ForbiddenError);
  });
});
