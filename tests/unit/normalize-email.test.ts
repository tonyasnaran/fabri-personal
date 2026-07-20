import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/lib/auth/normalize-email";

describe("normalizeEmail", () => {
  it("lowercases the address", () => {
    expect(normalizeEmail("User@Example.com")).toBe("user@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("treats case and whitespace variants as identical", () => {
    const a = normalizeEmail("  User@Example.com");
    const b = normalizeEmail("user@example.com  ");
    expect(a).toBe(b);
  });

  it("is idempotent", () => {
    const once = normalizeEmail("User@Example.com");
    expect(normalizeEmail(once)).toBe(once);
  });
});
