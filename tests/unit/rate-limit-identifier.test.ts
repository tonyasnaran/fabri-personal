import { describe, expect, it } from "vitest";
import {
  emailRateLimitId,
  ipRateLimitId,
  userRateLimitId,
} from "@/lib/security/rate-limit-identifier";

describe("rate-limit identifiers", () => {
  it("emailRateLimitId never contains the raw email address", () => {
    const id = emailRateLimitId("user@example.com");
    expect(id).not.toContain("user@example.com");
    expect(id).not.toContain("example.com");
  });

  it("emailRateLimitId is stable for the same (normalized) address", () => {
    expect(emailRateLimitId("User@Example.com")).toBe(emailRateLimitId("user@example.com "));
  });

  it("emailRateLimitId differs for different addresses", () => {
    expect(emailRateLimitId("a@example.com")).not.toBe(emailRateLimitId("b@example.com"));
  });

  it("ipRateLimitId derives from the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    const id = ipRateLimitId(request);
    expect(id).not.toContain("203.0.113.5");
    expect(id.startsWith("ip:")).toBe(true);
  });

  it("ipRateLimitId falls back to a stable value when no header is present", () => {
    const request = new Request("http://localhost/");
    expect(ipRateLimitId(request)).toBe(ipRateLimitId(new Request("http://localhost/")));
  });

  it("userRateLimitId embeds the user id namespaced, not raw", () => {
    expect(userRateLimitId("user_123")).toBe("user:user_123");
  });
});
