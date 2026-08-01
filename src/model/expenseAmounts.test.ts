import { describe, expect, it } from "vitest";
import { summarizeExpenseAmount } from "./expenseAmounts";

describe("summarizeExpenseAmount", () => {
  it("keeps ordinary payments at the entered amount", () => {
    expect(summarizeExpenseAmount("12.50", "Cash", 1)).toEqual({ rawAmount: 12.5, feeRate: 0, effectiveAmount: 12.5 });
  });

  it("applies the selected SPayLater tenure fee exactly once", () => {
    expect(summarizeExpenseAmount("100", "SPayLater", 6)).toEqual({ rawAmount: 100, feeRate: 0.09, effectiveAmount: 109.00000000000001 });
  });
});
