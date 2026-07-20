import "server-only";
import { z } from "zod";

/**
 * Server-only environment configuration.
 *
 * This module validates `process.env` eagerly on first import so the
 * application fails fast with a clear error instead of surfacing a
 * confusing runtime failure deep inside a request handler.
 *
 * Never import this module from a Client Component. The `server-only`
 * import above will throw a build error if that happens.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox"),
  PLAID_WEBHOOK_URL: z
    .union([z.url(), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),

  TOKEN_ENCRYPTION_KEY: z
    .string({ error: "TOKEN_ENCRYPTION_KEY is required" })
    .min(1, "TOKEN_ENCRYPTION_KEY is required")
    .refine((value) => {
      try {
        return Buffer.from(value, "base64").length === 32;
      } catch {
        return false;
      }
    }, "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte (256-bit) key"),

  APP_URL: z.url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration. Fix the following and restart:\n${issues}`);
  }

  return parsed.data;
}

/**
 * Lazily validates and caches the server environment. Deferred (rather than
 * validated at module scope) so importing this file doesn't crash tooling
 * that loads modules without a full environment, while still failing fast
 * the first time any server code actually needs a variable.
 */
export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = loadServerEnv();
  }
  return cachedEnv;
}

/** Test-only: clears the cached env so tests can re-validate with a fresh process.env. */
export function __resetServerEnvCacheForTests(): void {
  cachedEnv = undefined;
}
