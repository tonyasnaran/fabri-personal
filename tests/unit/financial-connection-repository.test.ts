import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    financialConnection: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      updateMany: mockUpdateMany,
    },
  },
}));

const {
  listFinancialConnectionsForUser,
  getFinancialConnectionForUser,
  disconnectFinancialConnectionForUser,
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

  it("disconnectFinancialConnectionForUser cannot update another user's connection", async () => {
    await disconnectFinancialConnectionForUser("user_1", "conn_owned_by_someone_else");
    const call = mockUpdateMany.mock.calls[0]![0];
    expect(call.where.userId).toBe("user_1");
    expect(call.where.id).toBe("conn_owned_by_someone_else");
  });
});
