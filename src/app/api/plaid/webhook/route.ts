import type { NextRequest } from "next/server";
import { handleWebhook, PlaidNotImplementedError } from "@/server/services/plaid-service";
import { apiSuccess, internalErrorResponse, notImplementedResponse } from "@/lib/api/response";
import { logger } from "@/lib/security/logger";

/**
 * Plaid calls this endpoint directly (no user session), so it cannot use
 * requireApiUser(). Instead it must be protected by verifying Plaid's
 * request signature.
 *
 * TODO(next-task): verify the `Plaid-Verification` JWT header against
 * Plaid's public key (https://plaid.com/docs/api/webhooks/webhook-verification/)
 * before trusting the payload. Until that's implemented, this handler does
 * not process webhook contents.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);

    // Placeholder: signature verification would happen here, before any
    // payload contents are trusted or acted upon.
    const result = await handleWebhook(payload);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof PlaidNotImplementedError) return notImplementedResponse(error.message);

    logger.error("plaid.webhook.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return internalErrorResponse();
  }
}
