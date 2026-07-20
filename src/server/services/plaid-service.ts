import "server-only";
import { z } from "zod";
import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "@/lib/plaid/client";
import { isPlaidConfigured, getPlaidEnv } from "@/lib/plaid/config";
import { verifyPlaidWebhook, WebhookVerificationError } from "@/lib/plaid/webhook-verification";
import { mapPlaidAccountToInput, mapPlaidTransactionToInput } from "@/lib/plaid/mappers";
import { encryptSecret, decryptSecret } from "@/lib/encryption/secret-encryption";
import { logger } from "@/lib/security/logger";
import { recordAuditEvent } from "@/lib/security/audit";
import { siteConfig } from "@/config/site";
import {
  createFinancialConnection,
  getFinancialConnectionForUser,
  getFinancialConnectionByPlaidItemId,
  updateFinancialConnectionStatus,
  deleteFinancialConnectionForUser,
} from "@/server/repositories/financial-connection.repository";
import { upsertFinancialAccount } from "@/server/repositories/financial-account.repository";
import {
  upsertTransactions,
  deleteTransactionsByPlaidIds,
} from "@/server/repositories/transaction.repository";
import {
  getSyncState,
  upsertSyncStateSuccess,
  upsertSyncStateError,
} from "@/server/repositories/transaction-sync-state.repository";
import type {
  CreateLinkTokenInput,
  ExchangePublicTokenInput,
  SyncTransactionsInput,
} from "@/lib/validation/plaid";
import {
  PlaidNotConfiguredError,
  PlaidResourceNotFoundError,
} from "@/server/services/plaid-errors";

export { PlaidNotConfiguredError, PlaidResourceNotFoundError };

function assertPlaidConfigured() {
  if (!isPlaidConfigured()) {
    throw new PlaidNotConfiguredError();
  }
}

// ---------------------------------------------------------------------------
// Link token creation
// ---------------------------------------------------------------------------

export async function createLinkToken(userId: string, _input: CreateLinkTokenInput) {
  assertPlaidConfigured();
  logger.info("plaid.create_link_token.attempt", { userId });

  const env = getPlaidEnv();
  const client = getPlaidClient();

  const response = await client.linkTokenCreate({
    client_name: siteConfig.name,
    language: "en",
    country_codes: [CountryCode.Us],
    user: { client_user_id: userId },
    products: [Products.Transactions],
    ...(env.PLAID_WEBHOOK_URL ? { webhook: env.PLAID_WEBHOOK_URL } : {}),
  });

  return { linkToken: response.data.link_token, expiration: response.data.expiration };
}

// ---------------------------------------------------------------------------
// Public token exchange
// ---------------------------------------------------------------------------

export async function exchangePublicToken(userId: string, input: ExchangePublicTokenInput) {
  assertPlaidConfigured();
  logger.info("plaid.exchange_public_token.attempt", { userId });

  const client = getPlaidClient();

  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: input.publicToken,
  });
  const { access_token: accessToken, item_id: itemId } = exchangeResponse.data;

  let institutionId: string | null = null;
  let institutionName: string | null = null;
  try {
    const accountsResponse = await client.accountsGet({ access_token: accessToken });
    institutionId = accountsResponse.data.item.institution_id ?? null;

    if (institutionId) {
      const institutionResponse = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = institutionResponse.data.institution.name;
    }

    const encryptedAccessToken = await encryptSecret(accessToken);
    const connection = await createFinancialConnection({
      userId,
      plaidItemId: itemId,
      encryptedAccessToken,
      institutionId,
      institutionName,
    });

    for (const account of accountsResponse.data.accounts) {
      await upsertFinancialAccount(mapPlaidAccountToInput(account, userId, connection.id));
    }

    await recordAuditEvent({
      userId,
      action: "plaid.connection_created",
      entityType: "FinancialConnection",
      entityId: connection.id,
      metadata: { institutionName: institutionName ?? "unknown" },
    });

    // Best-effort initial sync so transactions show up immediately instead
    // of waiting for the first webhook delivery (which also requires
    // PLAID_WEBHOOK_URL to be a real, publicly reachable HTTPS endpoint —
    // not the case for local dev). Ongoing updates still arrive via webhook.
    try {
      await runTransactionSync(connection.id, userId, accessToken);
    } catch (syncError) {
      logger.warn("plaid.exchange_public_token.initial_sync_failed", {
        userId,
        connectionId: connection.id,
        message: syncError instanceof Error ? syncError.message : "unknown error",
      });
    }

    logger.info("plaid.exchange_public_token.success", {
      userId,
      accountCount: accountsResponse.data.accounts.length,
    });

    return { connectionId: connection.id, accountCount: accountsResponse.data.accounts.length };
  } catch (error) {
    logger.error("plaid.exchange_public_token.failed", {
      userId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Transaction sync
// ---------------------------------------------------------------------------

async function runTransactionSync(connectionId: string, userId: string, accessToken: string) {
  const client = getPlaidClient();
  const existingState = await getSyncState(connectionId);

  let cursor = existingState?.cursor ?? undefined;
  let hasMore = true;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  // Plaid account_id -> our internal FinancialAccount.id, resolved lazily
  // as accounts appear in sync pages (an account can appear before it has
  // any transactions attributed to it in a given page).
  const accountIdMap = new Map<string, string>();

  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: accessToken,
      cursor,
      count: 250,
    });
    const data = response.data;

    for (const account of data.accounts) {
      const upserted = await upsertFinancialAccount(
        mapPlaidAccountToInput(account, userId, connectionId),
      );
      accountIdMap.set(account.account_id, upserted.id);
    }

    const upsertInputs = [...data.added, ...data.modified]
      .map((transaction) => {
        const internalAccountId = accountIdMap.get(transaction.account_id);
        if (!internalAccountId) return null;
        return mapPlaidTransactionToInput(transaction, userId, internalAccountId);
      })
      .filter((input) => input !== null);

    await upsertTransactions(upsertInputs);
    await deleteTransactionsByPlaidIds(data.removed.map((t) => t.transaction_id));

    addedCount += data.added.length;
    modifiedCount += data.modified.length;
    removedCount += data.removed.length;

    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  await upsertSyncStateSuccess(connectionId, cursor ?? "");

  return { added: addedCount, modified: modifiedCount, removed: removedCount };
}

export async function syncTransactions(userId: string, input: SyncTransactionsInput) {
  assertPlaidConfigured();
  logger.info("plaid.sync_transactions.attempt", { userId });

  const connection = await getFinancialConnectionForUser(userId, input.financialConnectionId);
  if (!connection) {
    throw new PlaidResourceNotFoundError();
  }

  const accessToken = await decryptSecret(connection.encryptedAccessToken);

  try {
    const result = await runTransactionSync(connection.id, userId, accessToken);

    await recordAuditEvent({
      userId,
      action: "plaid.transactions_synced",
      entityType: "FinancialConnection",
      entityId: connection.id,
      metadata: result,
    });

    logger.info("plaid.sync_transactions.success", {
      userId,
      connectionId: connection.id,
      ...result,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    await upsertSyncStateError(connection.id, message);
    logger.error("plaid.sync_transactions.failed", {
      userId,
      connectionId: connection.id,
      message,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Disconnect (revoke at Plaid + delete local data)
// ---------------------------------------------------------------------------

export async function disconnectConnection(userId: string, connectionId: string) {
  assertPlaidConfigured();

  const connection = await getFinancialConnectionForUser(userId, connectionId);
  if (!connection) {
    throw new PlaidResourceNotFoundError();
  }

  const accessToken = await decryptSecret(connection.encryptedAccessToken);
  const client = getPlaidClient();

  try {
    await client.itemRemove({ access_token: accessToken });
  } catch (error) {
    // Plaid returning an error here (e.g. the item was already removed on
    // their side) shouldn't block removing our own local copy — an item
    // the user can no longer see in their dashboard but that still exists
    // at Plaid is a worse outcome than the reverse.
    logger.warn("plaid.item_remove.failed", {
      userId,
      connectionId,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  await deleteFinancialConnectionForUser(userId, connectionId);

  await recordAuditEvent({
    userId,
    action: "plaid.connection_disconnected",
    entityType: "FinancialConnection",
    entityId: connectionId,
  });

  logger.info("plaid.disconnect.success", { userId, connectionId });
}

// ---------------------------------------------------------------------------
// Webhook handling
// ---------------------------------------------------------------------------

const webhookPayloadSchema = z.object({
  webhook_type: z.string(),
  webhook_code: z.string(),
  item_id: z.string(),
});

export async function handleWebhook(rawBody: string, verificationJwt: string | null) {
  assertPlaidConfigured();

  let payload: unknown;
  try {
    payload = await verifyPlaidWebhook(rawBody, verificationJwt);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      logger.warn("plaid.webhook.verification_failed", { message: error.message });
    }
    throw error;
  }

  const parsed = webhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    logger.warn("plaid.webhook.unrecognized_payload");
    return { processed: false };
  }

  const { webhook_type: webhookType, webhook_code: webhookCode, item_id: itemId } = parsed.data;
  logger.info("plaid.webhook.received", { webhookType, webhookCode });

  const connection = await getFinancialConnectionByPlaidItemId(itemId);
  if (!connection) {
    // Not necessarily an error — could be a webhook for an item removed
    // locally but not yet fully settled on Plaid's side.
    logger.warn("plaid.webhook.unknown_item");
    return { processed: false };
  }

  if (webhookType === "TRANSACTIONS") {
    const accessToken = await decryptSecret(connection.encryptedAccessToken);
    try {
      const result = await runTransactionSync(connection.id, connection.userId, accessToken);
      await recordAuditEvent({
        userId: connection.userId,
        action: "plaid.webhook.transactions_synced",
        entityType: "FinancialConnection",
        entityId: connection.id,
        metadata: { webhookCode, ...result },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      await upsertSyncStateError(connection.id, message);
      logger.error("plaid.webhook.sync_failed", { connectionId: connection.id, message });
    }
  } else if (webhookType === "ITEM") {
    if (webhookCode === "ERROR" || webhookCode === "PENDING_EXPIRATION") {
      await updateFinancialConnectionStatus(
        connection.id,
        webhookCode === "ERROR" ? "ERROR" : "PENDING_REAUTH",
      );
      await recordAuditEvent({
        userId: connection.userId,
        action: "plaid.webhook.item_status_changed",
        entityType: "FinancialConnection",
        entityId: connection.id,
        metadata: { webhookCode },
      });
    }
  }

  return { processed: true };
}
