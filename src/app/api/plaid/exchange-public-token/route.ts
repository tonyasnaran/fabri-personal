import type { NextRequest } from "next/server";
import { requireApiUser, UnauthorizedError } from "@/lib/auth/require-user";
import { exchangePublicTokenSchema } from "@/lib/validation/plaid";
import { exchangePublicToken, PlaidNotImplementedError } from "@/server/services/plaid-service";
import {
  apiSuccess,
  internalErrorResponse,
  notImplementedResponse,
  rateLimitedResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { logger } from "@/lib/security/logger";
import { getSensitiveEndpointRateLimiter } from "@/lib/security/rate-limit";
import { userRateLimitId } from "@/lib/security/rate-limit-identifier";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser();

    const { success } = await getSensitiveEndpointRateLimiter().limit(userRateLimitId(user.id));
    if (!success) return rateLimitedResponse();

    const body = await request.json().catch(() => ({}));
    const parsed = exchangePublicTokenSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await exchangePublicToken(user.id, parsed.data);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof PlaidNotImplementedError) return notImplementedResponse(error.message);

    logger.error("plaid.exchange_public_token.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return internalErrorResponse();
  }
}
