import { describe, expect, it } from "vitest";
import { buildBnplPlan } from "./bnplPlan";

const transaction = { id: "plan-1", date: "2026-11-15", type: "expense" as const, category: "Shopping", amount: 120, description: "Phone", paymentType: "SPayLater 3M", remarks: "", createdAt: "" };

describe("buildBnplPlan", () => {
  it("creates a rollover-safe installment schedule from local progress", () => {
    const plan = buildBnplPlan(transaction, JSON.stringify([1, 3, 99, "bad"]));
    expect(plan).toMatchObject({ tenureMonths: 3, monthlyAmount: 40, paidMonths: [1, 3], progressPct: 67 });
    expect(plan.schedule.map((slot) => slot.date)).toEqual(["2026-11-15", "2026-12-15", "2027-01-15"]);
  });

  it("uses a paid first month for transactions without an explicit tenure", () => {
    expect(buildBnplPlan({ ...transaction, paymentType: "SPayLater" }, null)).toMatchObject({ tenureMonths: 1, progressPct: 100 });
  });

  it("recovers from a malformed browser cache", () => {
    expect(buildBnplPlan(transaction, "not-json").paidMonths).toEqual([1]);
  });
});
