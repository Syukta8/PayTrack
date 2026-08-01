import { describe, expect, it } from "vitest";
import { parseSmsExpense } from "./smsParser";

describe("parseSmsExpense", () => {
  it("extracts advisory fields from a bank notification", () => {
    expect(parseSmsExpense("RM12.50 spent at PETRONAS via Maybank Debit Card", new Date(2026, 7, 1)))
      .toMatchObject({ amount: 12.5, category: "Transport", paymentMethod: "Debit card", date: "2026-08-01" });
  });

  it("keeps unknown messages reviewable with safe defaults", () => {
    expect(parseSmsExpense("A notification", new Date(2026, 7, 1))).toMatchObject({ amount: 0, category: "Personal", description: "A notification" });
  });
});
