import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const { requireUser, requireApiUser, UnauthorizedError } = await import("@/lib/auth/require-user");

describe("requireUser (Server Component guard)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in");
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
  });

  it("throws UnauthorizedError when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireApiUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns the authenticated user when a session exists", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_2", email: null, name: null } });
    const user = await requireApiUser();
    expect(user.id).toBe("user_2");
  });
});
