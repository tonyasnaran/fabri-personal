import { describe, expect, it, vi, beforeEach } from "vitest";
import { logger, __internal } from "@/lib/security/logger";

describe("structured logger redaction", () => {
  it("redacts known sensitive keys", () => {
    const redacted = __internal.redact({
      access_token: "secret-token-value",
      publicToken: "public-secret",
      Authorization: "Bearer abc123",
      cookie: "session=abc",
      password: "hunter2",
      accountNumber: "1234567890",
      safeField: "keep-me",
    }) as Record<string, unknown>;

    expect(redacted.access_token).toBe("[REDACTED]");
    expect(redacted.publicToken).toBe("[REDACTED]");
    expect(redacted.Authorization).toBe("[REDACTED]");
    expect(redacted.cookie).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.accountNumber).toBe("[REDACTED]");
    expect(redacted.safeField).toBe("keep-me");
  });

  it("redacts nested objects and arrays", () => {
    const redacted = __internal.redact({
      user: { id: "u1", secret: "s3cr3t" },
      items: [{ token_encryption_key: "topsecret" }],
    }) as { user: { secret: string }; items: Array<{ token_encryption_key: string }> };

    expect(redacted.user.secret).toBe("[REDACTED]");
    expect(redacted.items[0]?.token_encryption_key).toBe("[REDACTED]");
  });

  it("never writes redacted keys' values to the console", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logger.info("test event", { access_token: "should-not-appear", userId: "u1" });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0]![0] as string;
    expect(output).not.toContain("should-not-appear");
    expect(output).toContain("u1");

    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });
});
