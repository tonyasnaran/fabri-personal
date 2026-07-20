import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Plaid client mock -------------------------------------------------
const mockLinkTokenCreate = vi.fn();
const mockItemPublicTokenExchange = vi.fn();
const mockAccountsGet = vi.fn();
const mockInstitutionsGetById = vi.fn();
const mockTransactionsSync = vi.fn();
const mockItemRemove = vi.fn();

vi.mock("@/lib/plaid/client", () => ({
  getPlaidClient: () => ({
    linkTokenCreate: mockLinkTokenCreate,
    itemPublicTokenExchange: mockItemPublicTokenExchange,
    accountsGet: mockAccountsGet,
    institutionsGetById: mockInstitutionsGetById,
    transactionsSync: mockTransactionsSync,
    itemRemove: mockItemRemove,
  }),
}));

// --- Plaid config mock ---------------------------------------------------
const mockIsPlaidConfigured = vi.fn();
vi.mock("@/lib/plaid/config", () => ({
  isPlaidConfigured: () => mockIsPlaidConfigured(),
  getPlaidEnv: () => ({
    PLAID_CLIENT_ID: "client_id",
    PLAID_SECRET: "secret",
    PLAID_ENV: "sandbox",
    PLAID_WEBHOOK_URL: undefined,
  }),
}));

// --- Webhook verification mock -------------------------------------------
const mockVerifyPlaidWebhook = vi.fn();
vi.mock("@/lib/plaid/webhook-verification", async () => {
  const actual = await vi.importActual<typeof import("@/lib/plaid/webhook-verification")>(
    "@/lib/plaid/webhook-verification",
  );
  return { ...actual, verifyPlaidWebhook: mockVerifyPlaidWebhook };
});

// --- Encryption mock -------------------------------------------------
const mockEncryptSecret = vi.fn(async (value: string) => `encrypted(${value})`);
const mockDecryptSecret = vi.fn(async (value: string) =>
  value.replace(/^encrypted\((.*)\)$/, "$1"),
);
vi.mock("@/lib/encryption/secret-encryption", () => ({
  encryptSecret: (v: string) => mockEncryptSecret(v),
  decryptSecret: (v: string) => mockDecryptSecret(v),
}));

// --- Logger / audit mocks -------------------------------------------------
vi.mock("@/lib/security/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
const mockRecordAuditEvent = vi.fn();
vi.mock("@/lib/security/audit", () => ({ recordAuditEvent: mockRecordAuditEvent }));

// --- Repository mocks -------------------------------------------------
const mockCreateFinancialConnection = vi.fn();
const mockGetFinancialConnectionForUser = vi.fn();
const mockGetFinancialConnectionByPlaidItemId = vi.fn();
const mockUpdateFinancialConnectionStatus = vi.fn();
const mockDeleteFinancialConnectionForUser = vi.fn();
vi.mock("@/server/repositories/financial-connection.repository", () => ({
  createFinancialConnection: (...args: unknown[]) => mockCreateFinancialConnection(...args),
  getFinancialConnectionForUser: (...args: unknown[]) => mockGetFinancialConnectionForUser(...args),
  getFinancialConnectionByPlaidItemId: (...args: unknown[]) =>
    mockGetFinancialConnectionByPlaidItemId(...args),
  updateFinancialConnectionStatus: (...args: unknown[]) =>
    mockUpdateFinancialConnectionStatus(...args),
  deleteFinancialConnectionForUser: (...args: unknown[]) =>
    mockDeleteFinancialConnectionForUser(...args),
}));

const mockUpsertFinancialAccount = vi.fn();
vi.mock("@/server/repositories/financial-account.repository", () => ({
  upsertFinancialAccount: (...args: unknown[]) => mockUpsertFinancialAccount(...args),
}));

const mockUpsertTransactions = vi.fn();
const mockDeleteTransactionsByPlaidIds = vi.fn();
vi.mock("@/server/repositories/transaction.repository", () => ({
  upsertTransactions: (...args: unknown[]) => mockUpsertTransactions(...args),
  deleteTransactionsByPlaidIds: (...args: unknown[]) => mockDeleteTransactionsByPlaidIds(...args),
}));

const mockGetSyncState = vi.fn();
const mockUpsertSyncStateSuccess = vi.fn();
const mockUpsertSyncStateError = vi.fn();
vi.mock("@/server/repositories/transaction-sync-state.repository", () => ({
  getSyncState: (...args: unknown[]) => mockGetSyncState(...args),
  upsertSyncStateSuccess: (...args: unknown[]) => mockUpsertSyncStateSuccess(...args),
  upsertSyncStateError: (...args: unknown[]) => mockUpsertSyncStateError(...args),
}));

const {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  disconnectConnection,
  handleWebhook,
  PlaidNotConfiguredError,
  PlaidResourceNotFoundError,
} = await import("@/server/services/plaid-service");

function resetAllMocks() {
  for (const mock of [
    mockLinkTokenCreate,
    mockItemPublicTokenExchange,
    mockAccountsGet,
    mockInstitutionsGetById,
    mockTransactionsSync,
    mockItemRemove,
    mockIsPlaidConfigured,
    mockVerifyPlaidWebhook,
    mockEncryptSecret,
    mockDecryptSecret,
    mockRecordAuditEvent,
    mockCreateFinancialConnection,
    mockGetFinancialConnectionForUser,
    mockGetFinancialConnectionByPlaidItemId,
    mockUpdateFinancialConnectionStatus,
    mockDeleteFinancialConnectionForUser,
    mockUpsertFinancialAccount,
    mockUpsertTransactions,
    mockDeleteTransactionsByPlaidIds,
    mockGetSyncState,
    mockUpsertSyncStateSuccess,
    mockUpsertSyncStateError,
  ]) {
    mock.mockReset();
  }
  mockIsPlaidConfigured.mockReturnValue(true);
  mockEncryptSecret.mockImplementation(async (value: string) => `encrypted(${value})`);
  mockDecryptSecret.mockImplementation(async (value: string) =>
    value.replace(/^encrypted\((.*)\)$/, "$1"),
  );
}

describe("createLinkToken", () => {
  beforeEach(resetAllMocks);

  it("throws PlaidNotConfiguredError when Plaid isn't configured", async () => {
    mockIsPlaidConfigured.mockReturnValue(false);
    await expect(createLinkToken("user_1", {})).rejects.toBeInstanceOf(PlaidNotConfiguredError);
  });

  it("uses the authenticated user's id as client_user_id, not anything client-supplied", async () => {
    mockLinkTokenCreate.mockResolvedValue({
      data: { link_token: "link-abc", expiration: "2026-01-01" },
    });

    await createLinkToken("user_42", {});

    const call = mockLinkTokenCreate.mock.calls[0]![0];
    expect(call.user.client_user_id).toBe("user_42");
  });
});

describe("exchangePublicToken", () => {
  beforeEach(resetAllMocks);

  it("stores the access token encrypted, never in plaintext", async () => {
    mockItemPublicTokenExchange.mockResolvedValue({
      data: { access_token: "access-sandbox-secret", item_id: "item_1" },
    });
    mockAccountsGet.mockResolvedValue({
      data: { item: { institution_id: "ins_1" }, accounts: [] },
    });
    mockInstitutionsGetById.mockResolvedValue({ data: { institution: { name: "Test Bank" } } });
    mockCreateFinancialConnection.mockResolvedValue({ id: "conn_1" });
    mockTransactionsSync.mockResolvedValue({
      data: {
        accounts: [],
        added: [],
        modified: [],
        removed: [],
        next_cursor: "",
        has_more: false,
        transactions_update_status: "TRANSACTIONS_UPDATE_STATUS_UNKNOWN",
      },
    });
    mockGetSyncState.mockResolvedValue(null);

    await exchangePublicToken("user_1", { publicToken: "public-token" });

    // The real assertion of interest: encryptSecret() is called with the raw
    // token before anything is persisted, and the persisted value is
    // whatever encryptSecret() returned — never the raw token verbatim.
    expect(mockEncryptSecret).toHaveBeenCalledWith("access-sandbox-secret");
    const createCall = mockCreateFinancialConnection.mock.calls[0]![0];
    expect(createCall.encryptedAccessToken).toBe("encrypted(access-sandbox-secret)");
    expect(createCall.encryptedAccessToken).not.toBe("access-sandbox-secret");
    expect(createCall.userId).toBe("user_1");
  });

  it("does not fail the whole exchange if the best-effort initial sync throws", async () => {
    mockItemPublicTokenExchange.mockResolvedValue({
      data: { access_token: "access-sandbox-secret", item_id: "item_1" },
    });
    mockAccountsGet.mockResolvedValue({ data: { item: { institution_id: null }, accounts: [] } });
    mockCreateFinancialConnection.mockResolvedValue({ id: "conn_1" });
    mockGetSyncState.mockResolvedValue(null);
    mockTransactionsSync.mockRejectedValue(new Error("sync blew up"));

    await expect(exchangePublicToken("user_1", { publicToken: "public-token" })).resolves.toEqual({
      connectionId: "conn_1",
      accountCount: 0,
    });
  });
});

describe("syncTransactions", () => {
  beforeEach(resetAllMocks);

  it("throws PlaidResourceNotFoundError for a connection the user doesn't own", async () => {
    mockGetFinancialConnectionForUser.mockResolvedValue(null);
    await expect(
      syncTransactions("user_1", { financialConnectionId: "someone_elses_conn" }),
    ).rejects.toBeInstanceOf(PlaidResourceNotFoundError);

    // Never even attempts to decrypt/sync a connection it hasn't verified ownership of.
    expect(mockTransactionsSync).not.toHaveBeenCalled();
  });

  it("paginates while has_more is true, accumulating counts", async () => {
    mockGetFinancialConnectionForUser.mockResolvedValue({
      id: "conn_1",
      encryptedAccessToken: "encrypted(access-token)",
    });
    mockGetSyncState.mockResolvedValue({ cursor: null });

    mockTransactionsSync
      .mockResolvedValueOnce({
        data: {
          accounts: [],
          added: [
            {
              transaction_id: "t1",
              account_id: "acc_1",
              amount: 1,
              date: "2026-01-01",
              personal_finance_category: null,
            },
          ],
          modified: [],
          removed: [],
          next_cursor: "cursor-page-2",
          has_more: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          accounts: [],
          added: [],
          modified: [],
          removed: [{ transaction_id: "t0" }],
          next_cursor: "cursor-final",
          has_more: false,
        },
      });

    const result = await syncTransactions("user_1", { financialConnectionId: "conn_1" });

    expect(mockTransactionsSync).toHaveBeenCalledTimes(2);
    expect(result.removed).toBe(1);
    expect(mockUpsertSyncStateSuccess).toHaveBeenCalledWith("conn_1", "cursor-final");
  });

  it("records a sync error and rethrows when Plaid fails", async () => {
    mockGetFinancialConnectionForUser.mockResolvedValue({
      id: "conn_1",
      encryptedAccessToken: "encrypted(access-token)",
    });
    mockGetSyncState.mockResolvedValue(null);
    mockTransactionsSync.mockRejectedValue(new Error("Plaid is down"));

    await expect(syncTransactions("user_1", { financialConnectionId: "conn_1" })).rejects.toThrow(
      "Plaid is down",
    );
    expect(mockUpsertSyncStateError).toHaveBeenCalledWith("conn_1", "Plaid is down");
  });
});

describe("disconnectConnection", () => {
  beforeEach(resetAllMocks);

  it("throws PlaidResourceNotFoundError for a connection the user doesn't own", async () => {
    mockGetFinancialConnectionForUser.mockResolvedValue(null);
    await expect(disconnectConnection("user_1", "someone_elses_conn")).rejects.toBeInstanceOf(
      PlaidResourceNotFoundError,
    );
    expect(mockDeleteFinancialConnectionForUser).not.toHaveBeenCalled();
  });

  it("still deletes the local connection even if Plaid's itemRemove fails", async () => {
    mockGetFinancialConnectionForUser.mockResolvedValue({
      id: "conn_1",
      encryptedAccessToken: "encrypted(access-token)",
    });
    mockItemRemove.mockRejectedValue(new Error("item already removed"));

    await disconnectConnection("user_1", "conn_1");

    expect(mockDeleteFinancialConnectionForUser).toHaveBeenCalledWith("user_1", "conn_1");
  });
});

describe("handleWebhook", () => {
  beforeEach(resetAllMocks);

  it("does not process a payload that fails signature verification", async () => {
    const { WebhookVerificationError } = await import("@/lib/plaid/webhook-verification");
    mockVerifyPlaidWebhook.mockRejectedValue(new WebhookVerificationError("bad signature"));

    await expect(handleWebhook("{}", "bad-jwt")).rejects.toBeInstanceOf(WebhookVerificationError);
    expect(mockGetFinancialConnectionByPlaidItemId).not.toHaveBeenCalled();
  });

  it("returns processed:false for a webhook whose item isn't recognized", async () => {
    mockVerifyPlaidWebhook.mockResolvedValue({
      webhook_type: "TRANSACTIONS",
      webhook_code: "SYNC_UPDATES_AVAILABLE",
      item_id: "unknown_item",
    });
    mockGetFinancialConnectionByPlaidItemId.mockResolvedValue(null);

    const result = await handleWebhook("{}", "jwt");
    expect(result).toEqual({ processed: false });
  });

  it("syncs transactions for a recognized TRANSACTIONS webhook", async () => {
    mockVerifyPlaidWebhook.mockResolvedValue({
      webhook_type: "TRANSACTIONS",
      webhook_code: "SYNC_UPDATES_AVAILABLE",
      item_id: "item_1",
    });
    mockGetFinancialConnectionByPlaidItemId.mockResolvedValue({
      id: "conn_1",
      userId: "user_1",
      encryptedAccessToken: "encrypted(access-token)",
    });
    mockGetSyncState.mockResolvedValue(null);
    mockTransactionsSync.mockResolvedValue({
      data: {
        accounts: [],
        added: [],
        modified: [],
        removed: [],
        next_cursor: "c1",
        has_more: false,
      },
    });

    const result = await handleWebhook("{}", "jwt");
    expect(result).toEqual({ processed: true });
    expect(mockTransactionsSync).toHaveBeenCalled();
  });

  it("updates connection status for an ITEM error webhook", async () => {
    mockVerifyPlaidWebhook.mockResolvedValue({
      webhook_type: "ITEM",
      webhook_code: "ERROR",
      item_id: "item_1",
    });
    mockGetFinancialConnectionByPlaidItemId.mockResolvedValue({
      id: "conn_1",
      userId: "user_1",
      encryptedAccessToken: "encrypted(access-token)",
    });

    await handleWebhook("{}", "jwt");
    expect(mockUpdateFinancialConnectionStatus).toHaveBeenCalledWith("conn_1", "ERROR");
  });
});
