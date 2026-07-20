import { describe, expect, it } from "vitest";
import {
  mapPlaidAccountType,
  mapPlaidAccountToInput,
  mapPlaidTransactionToInput,
} from "@/lib/plaid/mappers";
import type { AccountBase, Transaction as PlaidTransaction } from "plaid";

function makeAccount(overrides: Partial<AccountBase> = {}): AccountBase {
  return {
    account_id: "acc_1",
    balances: {
      available: 100,
      current: 120,
      limit: null,
      iso_currency_code: "USD",
      unofficial_currency_code: null,
    },
    mask: "1234",
    name: "Checking",
    official_name: "Plaid Gold Checking",
    type: "depository",
    subtype: "checking",
    ...overrides,
  } as AccountBase;
}

function makeTransaction(overrides: Partial<PlaidTransaction> = {}): PlaidTransaction {
  return {
    transaction_id: "txn_1",
    account_id: "acc_1",
    amount: 12.34,
    iso_currency_code: "USD",
    unofficial_currency_code: null,
    date: "2026-01-15",
    authorized_date: "2026-01-14",
    name: "Coffee Shop",
    merchant_name: "Blue Bottle",
    pending: false,
    personal_finance_category: {
      primary: "FOOD_AND_DRINK",
      detailed: "FOOD_AND_DRINK_COFFEE",
      confidence_level: "HIGH",
    },
    ...overrides,
  } as PlaidTransaction;
}

describe("mapPlaidAccountType", () => {
  it("maps known Plaid types to our schema's AccountType", () => {
    expect(mapPlaidAccountType("depository")).toBe("DEPOSITORY");
    expect(mapPlaidAccountType("credit")).toBe("CREDIT");
    expect(mapPlaidAccountType("loan")).toBe("LOAN");
    expect(mapPlaidAccountType("investment")).toBe("INVESTMENT");
  });

  it("maps brokerage (legacy Plaid type) to INVESTMENT", () => {
    expect(mapPlaidAccountType("brokerage")).toBe("INVESTMENT");
  });

  it("falls back to OTHER for anything unrecognized", () => {
    expect(mapPlaidAccountType("something_new")).toBe("OTHER");
  });
});

describe("mapPlaidAccountToInput", () => {
  it("maps balances to decimal-safe strings, not floats", () => {
    const input = mapPlaidAccountToInput(makeAccount(), "user_1", "conn_1");
    expect(typeof input.currentBalance).toBe("string");
    expect(input.currentBalance).toBe("120.0000");
    expect(input.availableBalance).toBe("100.0000");
  });

  it("defaults currentBalance to 0 when Plaid returns null", () => {
    const account = makeAccount({
      balances: {
        available: null,
        current: null,
        limit: null,
        iso_currency_code: "USD",
        unofficial_currency_code: null,
      },
    });
    const input = mapPlaidAccountToInput(account, "user_1", "conn_1");
    expect(input.currentBalance).toBe("0.0000");
    expect(input.availableBalance).toBeNull();
  });

  it("carries userId and financialConnectionId from the caller, never from Plaid", () => {
    const input = mapPlaidAccountToInput(makeAccount(), "user_1", "conn_1");
    expect(input.userId).toBe("user_1");
    expect(input.financialConnectionId).toBe("conn_1");
  });
});

describe("mapPlaidTransactionToInput", () => {
  it("prefers merchant_name for description, falling back to name", () => {
    const withMerchant = mapPlaidTransactionToInput(makeTransaction(), "user_1", "acct_1");
    expect(withMerchant.description).toBe("Blue Bottle");

    const withoutMerchant = mapPlaidTransactionToInput(
      makeTransaction({ merchant_name: null }),
      "user_1",
      "acct_1",
    );
    expect(withoutMerchant.description).toBe("Coffee Shop");
  });

  it("maps personal_finance_category into primary/detailed fields", () => {
    const input = mapPlaidTransactionToInput(makeTransaction(), "user_1", "acct_1");
    expect(input.primaryCategory).toBe("FOOD_AND_DRINK");
    expect(input.detailedCategory).toBe("FOOD_AND_DRINK_COFFEE");
  });

  it("handles a missing personal_finance_category gracefully", () => {
    const input = mapPlaidTransactionToInput(
      makeTransaction({ personal_finance_category: null }),
      "user_1",
      "acct_1",
    );
    expect(input.primaryCategory).toBeNull();
    expect(input.detailedCategory).toBeNull();
  });

  it("maps the amount to a decimal-safe string", () => {
    const input = mapPlaidTransactionToInput(makeTransaction(), "user_1", "acct_1");
    expect(typeof input.amount).toBe("string");
    expect(input.amount).toBe("12.3400");
  });
});
