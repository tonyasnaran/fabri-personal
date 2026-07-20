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

// --- Required core server variables -----------------------------------
const coreEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),

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

  // Browser-safe: this is intentionally the only value in this schema that
  // is ever meant to reach a client, and even then only via server-rendered
  // links, never a NEXT_PUBLIC_ variable.
  APP_URL: z.url().default("http://localhost:3000"),
});

// --- Provider-specific variables (all optional at the schema level; ------
// --- pairing/shape is enforced by superRefine below) ----------------------
const providerEnvSchema = z.object({
  // Auth.js reads AUTH_TRUST_HOST directly from process.env itself; this
  // entry exists so a garbage value fails validation with a clear message
  // instead of being silently ignored.
  AUTH_TRUST_HOST: z.enum(["true", "false"]).optional(),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  AUTH_RESEND_KEY: z.string().optional(),
  AUTH_EMAIL_FROM: z.union([z.email(), z.literal("")]).optional(),

  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox"),
  PLAID_WEBHOOK_URL: z
    .union([z.url(), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

const serverEnvSchema = coreEnvSchema.extend(providerEnvSchema.shape).superRefine((env, ctx) => {
  // Each provider is validated as a logical pair: if either half is set,
  // both must be. This catches "I set the ID but forgot the secret" at
  // startup instead of a confusing silent "provider not offered" later.
  const requirePair = (
    idKey: "AUTH_GOOGLE_ID" | "AUTH_GITHUB_ID",
    secretKey: "AUTH_GOOGLE_SECRET" | "AUTH_GITHUB_SECRET",
    label: string,
  ) => {
    const id = env[idKey];
    const secret = env[secretKey];
    if (id && !secret) {
      ctx.addIssue({
        code: "custom",
        path: [secretKey],
        message: `${secretKey} is required when ${idKey} is set (${label} OAuth is half-configured)`,
      });
    }
    if (secret && !id) {
      ctx.addIssue({
        code: "custom",
        path: [idKey],
        message: `${idKey} is required when ${secretKey} is set (${label} OAuth is half-configured)`,
      });
    }
  };

  requirePair("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "Google");
  requirePair("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "GitHub");

  if (env.AUTH_RESEND_KEY && !env.AUTH_EMAIL_FROM) {
    ctx.addIssue({
      code: "custom",
      path: ["AUTH_EMAIL_FROM"],
      message: "AUTH_EMAIL_FROM (a valid sender address) is required when AUTH_RESEND_KEY is set",
    });
  }
  if (env.AUTH_EMAIL_FROM && !env.AUTH_RESEND_KEY) {
    ctx.addIssue({
      code: "custom",
      path: ["AUTH_RESEND_KEY"],
      message: "AUTH_RESEND_KEY is required when AUTH_EMAIL_FROM is set",
    });
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    // Only paths and messages are ever included — never the offending
    // value, so a misconfigured secret can't leak into a startup log.
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

/**
 * Provider-availability checks. Safe to call anywhere that's already past
 * `getServerEnv()` validation — by then, superRefine has already guaranteed
 * these are all-or-nothing pairs, so checking just one half is sufficient.
 */
export function isGoogleAuthConfigured(env: ServerEnv): boolean {
  return Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}

export function isGitHubAuthConfigured(env: ServerEnv): boolean {
  return Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET);
}

export function isEmailAuthConfigured(env: ServerEnv): boolean {
  return Boolean(env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM);
}
