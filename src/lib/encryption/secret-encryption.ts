import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { getServerEnv } from "@/config/env";

/**
 * Authenticated encryption (AES-256-GCM) for sensitive server-side secrets
 * such as Plaid access tokens. Never used for anything that needs to be
 * queried or indexed in plaintext form.
 *
 * Ciphertext format (versioned so the algorithm can be rotated later):
 *   v1:<base64 iv>:<base64 authTag>:<base64 ciphertext>
 *
 * Production note: the key currently comes from the TOKEN_ENCRYPTION_KEY
 * environment variable. Before handling real financial data, replace this
 * with envelope encryption backed by a cloud KMS (AWS KMS, GCP KMS, or
 * HashiCorp Vault) so the raw key never lives in application config.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const CIPHERTEXT_VERSION = "v1";

function getKey(): Buffer {
  const { TOKEN_ENCRYPTION_KEY } = getServerEnv();
  const key = Buffer.from(TOKEN_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export async function encryptSecret(value: string): Promise<string> {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("encryptSecret: value must be a non-empty string");
  }

  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    CIPHERTEXT_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export async function decryptSecret(value: string): Promise<string> {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("decryptSecret: value must be a non-empty string");
  }

  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== CIPHERTEXT_VERSION) {
    throw new Error("decryptSecret: unrecognized ciphertext format");
  }

  const [, ivPart, authTagPart, ciphertextPart] = parts;

  let iv: Buffer;
  let authTag: Buffer;
  let ciphertext: Buffer;
  try {
    iv = Buffer.from(ivPart as string, "base64");
    authTag = Buffer.from(authTagPart as string, "base64");
    ciphertext = Buffer.from(ciphertextPart as string, "base64");
  } catch {
    throw new Error("decryptSecret: malformed ciphertext encoding");
  }

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error("decryptSecret: invalid initialization vector length");
  }

  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    // Never leak details about *why* authentication failed (tampering vs wrong key).
    throw new Error(
      "decryptSecret: authentication failed, ciphertext may be corrupted or tampered with",
    );
  }
}
