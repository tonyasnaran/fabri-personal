import "server-only";
import { importJWK, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "node:crypto";
import type { JWKPublicKey } from "plaid";
import { getPlaidClient } from "@/lib/plaid/client";

/**
 * Verifies Plaid webhook requests per
 * https://plaid.com/docs/api/webhooks/webhook-verification/
 *
 * 1. The `Plaid-Verification` header is a JWT (ES256) whose `kid` names a
 *    public key fetched from `/webhook_verification_key/get`.
 * 2. The JWT payload's `request_body_sha256` must match a SHA-256 hash of
 *    the *raw* request body (verified before any JSON parsing).
 * 3. The token must be recent (Plaid recommends rejecting anything older
 *    than 5 minutes) to limit replay of a captured webhook request.
 */

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

// Verification keys are long-lived and rotate infrequently, so caching
// avoids a network round trip on every webhook delivery. Process-local —
// same single-instance caveat as the in-memory rate limiter.
const keyCache = new Map<string, JWKPublicKey>();

async function getVerificationKey(kid: string): Promise<JWKPublicKey> {
  const cached = keyCache.get(kid);
  if (cached && (cached.expired_at === null || cached.expired_at * 1000 > Date.now())) {
    return cached;
  }

  const client = getPlaidClient();
  const response = await client.webhookVerificationKeyGet({ key_id: kid });
  const key = response.data.key;

  if (key.expired_at !== null && key.expired_at * 1000 <= Date.now()) {
    throw new WebhookVerificationError("Webhook verification key has expired");
  }

  keyCache.set(kid, key);
  return key;
}

function decodeJwtHeader(token: string): { alg?: string; kid?: string } {
  const headerPart = token.split(".")[0];
  if (!headerPart) {
    throw new WebhookVerificationError("Malformed verification token");
  }
  try {
    return JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
  } catch {
    throw new WebhookVerificationError("Malformed verification token header");
  }
}

/**
 * Verifies a webhook request and returns its parsed JSON payload. Throws
 * WebhookVerificationError on any failure — callers must never process a
 * webhook body that this function hasn't returned successfully.
 */
export async function verifyPlaidWebhook(
  rawBody: string,
  verificationJwt: string | null,
): Promise<unknown> {
  if (!verificationJwt) {
    throw new WebhookVerificationError("Missing Plaid-Verification header");
  }

  const header = decodeJwtHeader(verificationJwt);
  if (header.alg !== "ES256") {
    throw new WebhookVerificationError("Unexpected verification token algorithm");
  }
  if (!header.kid) {
    throw new WebhookVerificationError("Verification token missing key id");
  }

  const jwk = await getVerificationKey(header.kid);
  const publicKey = await importJWK({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, "ES256");

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(verificationJwt, publicKey, { algorithms: ["ES256"] });
    payload = result.payload;
  } catch {
    throw new WebhookVerificationError("Webhook signature verification failed");
  }

  const issuedAt = payload.iat;
  if (typeof issuedAt !== "number" || Date.now() / 1000 - issuedAt > MAX_WEBHOOK_AGE_SECONDS) {
    throw new WebhookVerificationError("Webhook token is missing or has an invalid issued-at time");
  }

  const expectedHash = payload["request_body_sha256"];
  if (typeof expectedHash !== "string") {
    throw new WebhookVerificationError("Verification token missing request body hash");
  }

  const actualHash = createHash("sha256").update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(actualHash, "hex");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new WebhookVerificationError("Webhook body hash mismatch");
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new WebhookVerificationError("Webhook body is not valid JSON");
  }
}
