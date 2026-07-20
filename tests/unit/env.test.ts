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
});
