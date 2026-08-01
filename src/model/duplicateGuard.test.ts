import { describe, expect, it } from "vitest";
import { describeDuplicate, findDuplicates } from "./duplicateGuard";
import type { Transaction } from "./types";

const transaction: Transaction = {
  id: "tx-1", date: "2026-08-01", type: "expense", category: "Food & Dining",
  amount: 12.3, description: "7-Eleven Malaysia", paymentType: "Cash", remarks: "", createdAt: "2026-08-01T00:00:00.000Z",
};

describe("findDuplicates", () => {
  it("matches rounded amounts and normalized merchant names", () => {
    const candidate = { date: "2026-08-01", amount: 12.29999999, description: "7 eleven malaysia", type: "expense" as const };
    expect(findDuplicates([transaction], candidate)).toEqual([transaction]);
    expect(describeDuplicate([transaction], candidate)).toContain("Possible duplicate");
  });

  it("does not block distinct dates or transaction types", () => {
    expect(findDuplicates([transaction], { date: "2026-08-02", amount: 12.3, description: "7-Eleven", type: "expense" })).toEqual([]);
    expect(findDuplicates([transaction], { date: "2026-08-01", amount: 12.3, description: "7-Eleven", type: "income" })).toEqual([]);
  });
});
