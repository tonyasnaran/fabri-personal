import "server-only";
import { isPlaidConfigured } from "@/lib/plaid/config";
import { logger } from "@/lib/security/logger";
import type {
  CreateLinkTokenInput,
  ExchangePublicTokenInput,
  SyncTransactionsInput,
} from "@/lib/validation/plaid";

/**
 * Placeholder Plaid business logic. Route handlers call these instead of
 * touching the Plaid client or Prisma directly. Every method currently
 * throws PlaidNotImplementedError — this task only builds the foundation,
 * not live Plaid integration. Do not connect real accounts or use
 * production Plaid credentials until this is implemented and reviewed.
 */

export class PlaidNotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaidNotImplementedError";
  }
}

function assertReady(action: string) {
  if (!isPlaidConfigured()) {
    logger.warn("plaid.not_configured", { action });
  }
  throw new PlaidNotImplementedError(`${action} is not implemented yet`);
}

// TODO(next-task): call plaidClient.linkTokenCreate() with the authenticated
// user's id as the Plaid `client_user_id`, using getPlaidClient() from
// src/lib/plaid/client.ts. Use PLAID_WEBHOOK_URL for the webhook field.
export async function createLinkToken(userId: string, _input: CreateLinkTokenInput) {
  logger.info("plaid.create_link_token.attempt", { userId });
  assertReady("createLinkToken");
}

// TODO(next-task): call plaidClient.itemPublicTokenExchange(), then
// encryptSecret() the returned access_token before persisting it via
// financial-connection.repository.ts. Never store or log the raw token.
export async function exchangePublicToken(userId: string, _input: ExchangePublicTokenInput) {
  logger.info("plaid.exchange_public_token.attempt", { userId });
  assertReady("exchangePublicToken");
}

// TODO(next-task): decryptSecret() the stored access token, call
// plaidClient.transactionsSync() using the cursor from TransactionSyncState,
// and upsert accounts/transactions using the unique Plaid ids so retries
// are idempotent.
export async function syncTransactions(userId: string, _input: SyncTransactionsInput) {
  logger.info("plaid.sync_transactions.attempt", { userId });
  assertReady("syncTransactions");
}

// TODO(next-task): verify the Plaid-Verification header signature (see
// https://plaid.com/docs/api/webhooks/webhook-verification/) before
// processing any webhook payload.
export async function handleWebhook(payload: unknown) {
  logger.info("plaid.webhook.received", { hasPayload: Boolean(payload) });
  assertReady("handleWebhook");
}
