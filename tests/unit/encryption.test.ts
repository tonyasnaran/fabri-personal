import { describe, expect, it, vi, beforeEach } from "vitest";
import { randomBytes } from "node:crypto";

const TEST_KEY = randomBytes(32).toString("base64");

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ TOKEN_ENCRYPTION_KEY: TEST_KEY }),
}));

const { encryptSecret, decryptSecret } = await import("@/lib/encryption/secret-encryption");

describe("secret-encryption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("round-trips a plaintext value", async () => {
    const plaintext = "access-sandbox-1234567890";
    const ciphertext = await encryptSecret(plaintext);

    expect(ciphertext).not.toContain(plaintext);
    expect(ciphertext.startsWith("v1:")).toBe(true);

    const decrypted = await decryptSecret(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV)", async () => {
    const a = await encryptSecret("same-value");
    const b = await encryptSecret("same-value");
    expect(a).not.toBe(b);
  });

  it("rejects tampered ciphertext", async () => {
    const ciphertext = await encryptSecret("sensitive-token");
    const parts = ciphertext.split(":");
    // Flip the last character of the ciphertext payload to corrupt it.
    const corruptedPayload = parts[3]!.slice(0, -1) + (parts[3]!.endsWith("A") ? "B" : "A");
    const corrupted = [parts[0], parts[1], parts[2], corruptedPayload].join(":");

    await expect(decryptSecret(corrupted)).rejects.toThrow();
  });

  it("rejects malformed ciphertext format", async () => {
    await expect(decryptSecret("not-a-valid-format")).rejects.toThrow();
    await expect(decryptSecret("v2:a:b:c")).rejects.toThrow();
  });

  it("rejects empty input", async () => {
    await expect(encryptSecret("")).rejects.toThrow();
    await expect(decryptSecret("")).rejects.toThrow();
  });
});
