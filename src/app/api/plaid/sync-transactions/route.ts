import type { NextRequest } from "next/server";
import { requireApiUser, UnauthorizedError } from "@/lib/auth/require-user";
import { syncTransactionsSchema } from "@/lib/validation/plaid";
import { syncTransactions, PlaidNotImplementedError } from "@/server/services/plaid-service";
import {
  apiSuccess,
  internalErrorResponse,
  notImplementedResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { logger } from "@/lib/security/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser();

    const body = await request.json().catch(() => ({}));
    const parsed = syncTransactionsSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await syncTransactions(user.id, parsed.data);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof PlaidNotImplementedError) return notImplementedResponse(error.message);

    logger.error("plaid.sync_transactions.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return internalErrorResponse();
  }
}
