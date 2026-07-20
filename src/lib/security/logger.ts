import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

/**
 * Field names (case-insensitive, matched as substrings) that must never
 * appear in log output. Covers Plaid tokens, auth material, and PII that
 * would otherwise leak into logs verbatim.
 */
const REDACTED_KEY_PATTERNS = [
  "access_token",
  "accesstoken",
  "public_token",
  "publictoken",
  "authorization",
  "cookie",
  "secret",
  "password",
  "encryption_key",
  "encryptionkey",
  "token_encryption_key",
  "account_number",
  "accountnumber",
  "iban",
  "ssn",
  "client_secret",
  "clientsecret",
];

const REDACTED = "[REDACTED]";

function isRedactedKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return REDACTED_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  if (value !== null && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      output[key] = isRedactedKey(key) ? REDACTED : redact(val, seen);
    }
    return output;
  }

  return value;
}

function write(level: LogLevel, message: string, meta?: LogMeta): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
};

/** Exposed for tests that need to verify redaction without going through console. */
export const __internal = { redact, isRedactedKey };
