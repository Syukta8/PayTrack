import { describe, expect, it } from "vitest";
import { buildDashboardMetrics } from "./dashboardMetrics";
import type { Transaction } from "./types";

const rows: Transaction[] = [
  { id: "income", date: "2026-07-01", type: "income", category: "Salary", amount: 1000, description: "Salary", paymentType: "", remarks: "", createdAt: "" },
  { id: "food", date: "2026-07-02", type: "expense", category: "Food & Dining", amount: 25, description: "Lunch", paymentType: "", remarks: "", createdAt: "", tax: 1, serviceCharge: 2 },
  { id: "later", date: "2026-08-01", type: "expense", category: "Shopping", amount: 50, description: "Later", paymentType: "", remarks: "", createdAt: "" },
];

describe("buildDashboardMetrics", () => {
  it("keeps totals, taxes, and charts inside the requested month", () => {
    const metrics = buildDashboardMetrics(rows, "2026-07");
    expect(metrics).toMatchObject({ income: 1000, expense: 25, balance: 975, tax: 1, serviceCharge: 2, firstDay: "2026-07-01", lastDay: "2026-07-31" });
    expect(metrics.pieData).toEqual([{ name: "Food & Dining", value: 25 }]);
    expect(metrics.subcategoryData[0]).toMatchObject({ name: "Lunch", amount: 25 });
  });
});
