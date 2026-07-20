import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, getAuthErrorHeading } from "@/lib/auth/error-messages";

describe("auth error message mapping", () => {
  it("maps known client-safe codes to distinct, non-technical copy", () => {
    expect(getAuthErrorMessage("AccessDenied")).toMatch(/access/i);
    expect(getAuthErrorMessage("Verification")).toMatch(/expired|invalid/i);
    expect(getAuthErrorMessage("OAuthAccountNotLinked")).toMatch(/already associated/i);
  });

  it("falls back to a generic safe message for unknown/undefined codes", () => {
    const fallback = getAuthErrorMessage(undefined);
    expect(fallback).toMatch(/went wrong/i);
    expect(getAuthErrorMessage("SomeInternalConfigError")).toBe(fallback);
    expect(getAuthErrorMessage(null)).toBe(fallback);
  });

  it("never echoes the raw error code back into the message", () => {
    const code = "SomeInternalConfigError";
    expect(getAuthErrorMessage(code)).not.toContain(code);
  });

  it("provides a heading for every code without throwing", () => {
    for (const code of ["AccessDenied", "Verification", "OAuthAccountNotLinked", "Unknown", null]) {
      expect(() => getAuthErrorHeading(code)).not.toThrow();
      expect(typeof getAuthErrorHeading(code)).toBe("string");
    }
  });
});
