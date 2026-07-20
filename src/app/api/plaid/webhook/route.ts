import type { NextRequest } from "next/server";
import { handleWebhook, PlaidNotConfiguredError } from "@/server/services/plaid-service";
import { WebhookVerificationError } from "@/lib/plaid/webhook-verification";
import {
  apiSuccess,
  internalErrorResponse,
  notImplementedResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { logger } from "@/lib/security/logger";

/**
 * Plaid calls this endpoint directly (no user session), so it cannot use
 * requireApiUser(). Instead it's protected by verifying the `Plaid-Verification`
 * JWT header against Plaid's public key — see src/lib/plaid/webhook-verification.ts.
 *
 * Reads the body as raw text (not request.json()) because signature
 * verification needs the exact bytes Plaid signed; parsing to an object
 * first and re-serializing it is not guaranteed to reproduce the same bytes.
 *
 * Not rate-limited: Plaid retries failed webhook deliveries, and the
 * signature check itself already rejects anything that isn't a genuine,
 * recent Plaid request before any real work happens.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verificationJwt = request.headers.get("plaid-verification");

    const result = await handleWebhook(rawBody, verificationJwt);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      // Deliberately generic + 401, not 400: don't help an attacker
      // distinguish "bad signature" from "malformed request".
      return unauthorizedResponse("Webhook verification failed");
    }
    if (error instanceof PlaidNotConfiguredError) return notImplementedResponse(error.message);

    logger.error("plaid.webhook.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return internalErrorResponse();
  }
}
