import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { createHash } from "node:crypto";

const mockWebhookVerificationKeyGet = vi.fn();

vi.mock("@/lib/plaid/client", () => ({
  getPlaidClient: () => ({
    webhookVerificationKeyGet: mockWebhookVerificationKeyGet,
  }),
}));

const { verifyPlaidWebhook, WebhookVerificationError } =
  await import("@/lib/plaid/webhook-verification");

async function createSignedWebhook(
  body: string,
  options?: { kid?: string; iatOffsetSeconds?: number },
) {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const kid = options?.kid ?? "test-key-1";

  const bodyHash = createHash("sha256").update(body).digest("hex");
  const iat = Math.floor(Date.now() / 1000) + (options?.iatOffsetSeconds ?? 0);

  const jwt = await new SignJWT({ request_body_sha256: bodyHash })
    .setProtectedHeader({ alg: "ES256", kid })
    .setIssuedAt(iat)
    .sign(privateKey);

  mockWebhookVerificationKeyGet.mockResolvedValue({
    data: {
      key: {
        ...jwk,
        kid,
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
        use: "sig",
        alg: "ES256",
        created_at: iat,
        expired_at: null,
      },
    },
  });

  return jwt;
}

describe("verifyPlaidWebhook", () => {
  beforeEach(() => {
    mockWebhookVerificationKeyGet.mockReset();
  });

  it("accepts a correctly signed webhook whose body hash matches", async () => {
    const body = JSON.stringify({
      webhook_type: "TRANSACTIONS",
      webhook_code: "SYNC_UPDATES_AVAILABLE",
    });
    const jwt = await createSignedWebhook(body);

    const payload = await verifyPlaidWebhook(body, jwt);
    expect(payload).toEqual({
      webhook_type: "TRANSACTIONS",
      webhook_code: "SYNC_UPDATES_AVAILABLE",
    });
  });

  it("rejects when the Plaid-Verification header is missing", async () => {
    await expect(verifyPlaidWebhook("{}", null)).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  it("rejects when the body has been tampered with after signing", async () => {
    const originalBody = JSON.stringify({ webhook_type: "TRANSACTIONS" });
    const jwt = await createSignedWebhook(originalBody);

    const tamperedBody = JSON.stringify({ webhook_type: "ITEM" });
    await expect(verifyPlaidWebhook(tamperedBody, jwt)).rejects.toBeInstanceOf(
      WebhookVerificationError,
    );
  });

  it("rejects a token signed with a different key than the one Plaid vouches for", async () => {
    const body = JSON.stringify({ webhook_type: "TRANSACTIONS" });
    const jwt = await createSignedWebhook(body);

    // Swap in an unrelated key as "the" verification key for this kid.
    const other = await generateKeyPair("ES256");
    const otherJwk = await exportJWK(other.publicKey);
    mockWebhookVerificationKeyGet.mockResolvedValue({
      data: {
        key: {
          ...otherJwk,
          kid: "test-key-1",
          use: "sig",
          alg: "ES256",
          created_at: 0,
          expired_at: null,
        },
      },
    });

    await expect(verifyPlaidWebhook(body, jwt)).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  it("rejects a stale token (issued more than 5 minutes ago)", async () => {
    const body = JSON.stringify({ webhook_type: "TRANSACTIONS" });
    const jwt = await createSignedWebhook(body, { iatOffsetSeconds: -10 * 60 });

    await expect(verifyPlaidWebhook(body, jwt)).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  it("rejects a malformed token", async () => {
    await expect(verifyPlaidWebhook("{}", "not-a-jwt")).rejects.toBeInstanceOf(
      WebhookVerificationError,
    );
  });
});
