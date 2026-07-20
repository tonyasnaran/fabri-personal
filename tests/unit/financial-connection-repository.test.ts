import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    financialConnection: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      deleteMany: mockDeleteMany,
    },
  },
}));

const {
  listFinancialConnectionsForUser,
  getFinancialConnectionForUser,
  getFinancialConnectionByPlaidItemId,
  createFinancialConnection,
  updateFinancialConnectionStatus,
  deleteFinancialConnectionForUser,
} = await import("@/server/repositories/financial-connection.repository");

describe("financial-connection repository — user scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listFinancialConnectionsForUser always filters by the given userId", async () => {
    await listFinancialConnectionsForUser("user_1");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("getFinancialConnectionForUser scopes by both userId and connectionId, never id alone", async () => {
    await getFinancialConnectionForUser("user_1", "conn_1");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "conn_1", userId: "user_1" },
    });
  });

  it("getFinancialConnectionByPlaidItemId looks up by Plaid's item id, for webhook processing only", async () => {
    await getFinancialConnectionByPlaidItemId("plaid_item_1");
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { plaidItemId: "plaid_item_1" } });
  });

  it("createFinancialConnection persists the encrypted token, never a raw one", async () => {
    await createFinancialConnection({
      userId: "user_1",
      plaidItemId: "plaid_item_1",
      encryptedAccessToken: "v1:iv:tag:ciphertext",
      institutionId: "ins_1",
      institutionName: "Test Bank",
    });

    const call = mockCreate.mock.calls[0]![0];
    expect(call.data.userId).toBe("user_1");
    expect(call.data.encryptedAccessToken).toBe("v1:iv:tag:ciphertext");
    expect(call.data.encryptedAccessToken).not.toContain("access-sandbox");
  });

  it("updateFinancialConnectionStatus updates by connection id", async () => {
    await updateFinancialConnectionStatus("conn_1", "ERROR");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "conn_1" },
      data: { status: "ERROR" },
    });
  });

  it("deleteFinancialConnectionForUser cannot delete another user's connection", async () => {
    await deleteFinancialConnectionForUser("user_1", "conn_owned_by_someone_else");
    const call = mockDeleteMany.mock.calls[0]![0];
    expect(call.where.userId).toBe("user_1");
    expect(call.where.id).toBe("conn_owned_by_someone_else");
  });
});
