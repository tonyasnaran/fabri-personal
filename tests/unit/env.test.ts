import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { randomBytes } from "node:crypto";

const ORIGINAL_ENV = { ...process.env };

const VALID_ENV = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  AUTH_SECRET: "a".repeat(32),
  TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  APP_URL: "http://localhost:3000",
} as const;

describe("server env validation", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("parses successfully when all required variables are present", async () => {
    process.env = { ...process.env, ...VALID_ENV };
    const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
    __resetServerEnvCacheForTests();

    const env = getServerEnv();
    expect(env.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
    expect(env.PLAID_ENV).toBe("sandbox");
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    process.env = { ...process.env, ...VALID_ENV, DATABASE_URL: "" };
    const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
    __resetServerEnvCacheForTests();

    expect(() => getServerEnv()).toThrow(/DATABASE_URL/);
  });

  it("throws when AUTH_SECRET is too short", async () => {
    process.env = { ...process.env, ...VALID_ENV, AUTH_SECRET: "short" };
    const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
    __resetServerEnvCacheForTests();

    expect(() => getServerEnv()).toThrow(/AUTH_SECRET/);
  });

  it("throws when TOKEN_ENCRYPTION_KEY does not decode to 32 bytes", async () => {
    process.env = { ...process.env, ...VALID_ENV, TOKEN_ENCRYPTION_KEY: "not-32-bytes" };
    const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
    __resetServerEnvCacheForTests();

    expect(() => getServerEnv()).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });

  describe("provider-pair validation", () => {
    it("throws a useful error when AUTH_GOOGLE_ID is set without AUTH_GOOGLE_SECRET", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_GOOGLE_ID: "google-client-id",
        AUTH_GOOGLE_SECRET: "",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).toThrow(/AUTH_GOOGLE_SECRET/);
    });

    it("throws a useful error when AUTH_GITHUB_SECRET is set without AUTH_GITHUB_ID", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_GITHUB_ID: "",
        AUTH_GITHUB_SECRET: "github-secret",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).toThrow(/AUTH_GITHUB_ID/);
    });

    it("throws when AUTH_RESEND_KEY is set without a valid AUTH_EMAIL_FROM", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_RESEND_KEY: "re_test_key",
        AUTH_EMAIL_FROM: "",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).toThrow(/AUTH_EMAIL_FROM/);
    });

    it("throws when AUTH_EMAIL_FROM is set without AUTH_RESEND_KEY", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_RESEND_KEY: "",
        AUTH_EMAIL_FROM: "dashboard@example.com",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).toThrow(/AUTH_RESEND_KEY/);
    });

    it("succeeds when Google, GitHub, and Resend are all fully paired", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_GOOGLE_ID: "google-id",
        AUTH_GOOGLE_SECRET: "google-secret",
        AUTH_GITHUB_ID: "github-id",
        AUTH_GITHUB_SECRET: "github-secret",
        AUTH_RESEND_KEY: "re_test_key",
        AUTH_EMAIL_FROM: "dashboard@example.com",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).not.toThrow();
    });

    it("never includes the offending value in the error message", async () => {
      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_GOOGLE_ID: "super-secret-client-id-value",
        AUTH_GOOGLE_SECRET: "",
      };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      try {
        getServerEnv();
        throw new Error("expected getServerEnv to throw");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).not.toContain("super-secret-client-id-value");
      }
    });

    it("rejects a garbage AUTH_TRUST_HOST value", async () => {
      process.env = { ...process.env, ...VALID_ENV, AUTH_TRUST_HOST: "yes-please" };
      const { getServerEnv, __resetServerEnvCacheForTests } = await import("@/config/env");
      __resetServerEnvCacheForTests();

      expect(() => getServerEnv()).toThrow(/AUTH_TRUST_HOST/);
    });
  });

  describe("provider-availability helpers", () => {
    it("report configured only when both halves of a pair are present", async () => {
      const {
        getServerEnv,
        __resetServerEnvCacheForTests,
        isGoogleAuthConfigured,
        isGitHubAuthConfigured,
        isEmailAuthConfigured,
      } = await import("@/config/env");

      process.env = {
        ...process.env,
        ...VALID_ENV,
        AUTH_GOOGLE_ID: "google-id",
        AUTH_GOOGLE_SECRET: "google-secret",
      };
      __resetServerEnvCacheForTests();
      const env = getServerEnv();

      expect(isGoogleAuthConfigured(env)).toBe(true);
      expect(isGitHubAuthConfigured(env)).toBe(false);
      expect(isEmailAuthConfigured(env)).toBe(false);
    });
  });
});
