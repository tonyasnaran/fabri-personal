import type { NextRequest } from "next/server";
import { requireApiUser, UnauthorizedError } from "@/lib/auth/require-user";
import { createLinkTokenSchema } from "@/lib/validation/plaid";
import { createLinkToken, PlaidNotConfiguredError } from "@/server/services/plaid-service";
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
    const parsed = createLinkTokenSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await createLinkToken(user.id, parsed.data);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof PlaidNotConfiguredError) return notImplementedResponse(error.message);

    logger.error("plaid.create_link_token.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return internalErrorResponse();
  }
}
