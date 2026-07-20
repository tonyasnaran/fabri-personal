import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: { auditLog: { create: mockCreate } },
}));

vi.mock("@/lib/security/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: mockLoggerError },
}));

const { recordAuditEvent } = await import("@/lib/security/audit");

describe("recordAuditEvent", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockLoggerError.mockReset();
  });

  it("writes an audit log row with the given fields", async () => {
    mockCreate.mockResolvedValue({});

    await recordAuditEvent({
      userId: "user_1",
      action: "auth.sign_in",
      entityType: "User",
      entityId: "user_1",
      metadata: { provider: "google" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        action: "auth.sign_in",
        entityType: "User",
        entityId: "user_1",
        metadata: { provider: "google" },
        ipAddress: null,
      },
    });
  });

  it("defaults optional fields to null/undefined rather than throwing", async () => {
    mockCreate.mockResolvedValue({});

    await recordAuditEvent({
      action: "auth.unauthorized_dashboard_access",
      entityType: "Dashboard",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        action: "auth.unauthorized_dashboard_access",
        entityType: "Dashboard",
        entityId: null,
        metadata: undefined,
        ipAddress: null,
      },
    });
  });

  it("never throws when the database write fails, and logs the failure instead", async () => {
    mockCreate.mockRejectedValue(new Error("connection refused"));

    await expect(
      recordAuditEvent({ action: "auth.sign_in", entityType: "User" }),
    ).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      "audit.write_failed",
      expect.objectContaining({ action: "auth.sign_in" }),
    );
  });
});
