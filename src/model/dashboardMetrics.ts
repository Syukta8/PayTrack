import type { Transaction } from "./types";
import { trackingCycleForDate } from "./trackingCycle";

const BAR_COLORS = ["#a855f7", "#f97316", "#ec4899", "#06b6d4", "#78350f", "#3b82f6", "#10b981"];
const RECEIPT_CATEGORIES = new Set(["Food & Dining", "Shopping", "Entertainment"]);

/** Builds the dashboard's month-level financial metrics from persisted transactions.
 * Keeping these calculations outside the view makes the totals independently testable. */
export function buildDashboardMetrics(transactions: Transaction[], cycleStart: string, cycleStartDay = 1) {
  const { start: firstDay, end: lastDay } = trackingCycleForDate(cycleStart, cycleStartDay);
  const monthTransactions = transactions.filter((transaction) => transaction.date >= firstDay && transaction.date <= lastDay);
  const daysInCycle = Math.round((new Date(`${lastDay}T00:00:00`).getTime() - new Date(`${firstDay}T00:00:00`).getTime()) / 86_400_000) + 1;
  const categoryTotals = new Map<string, number>();
  const subcategoryTotals = new Map<string, number>();
  const dailyTotals = new Map<number, number>();
  let income = 0;
  let expense = 0;
  let tax = 0;
  let serviceCharge = 0;

  monthTransactions.forEach((transaction) => {
    const isExpense = transaction.type === "expense" || transaction.category !== "Salary";
    if (!isExpense) {
      income += transaction.amount;
      return;
    }

    expense += transaction.amount;
    categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) ?? 0) + transaction.amount);
    if (RECEIPT_CATEGORIES.has(transaction.category)) {
      const label = transaction.description || transaction.category;
      subcategoryTotals.set(label, (subcategoryTotals.get(label) ?? 0) + transaction.amount);
    }
    tax += transaction.tax ?? 0;
    serviceCharge += transaction.serviceCharge ?? 0;
    const day = Math.round((new Date(`${transaction.date}T00:00:00`).getTime() - new Date(`${firstDay}T00:00:00`).getTime()) / 86_400_000) + 1;
    if (Number.isInteger(day) && day >= 1 && day <= daysInCycle) {
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + transaction.amount);
    }
  });

  return {
    monthTransactions,
    income,
    expense,
    balance: income - expense,
    tax,
    serviceCharge,
    firstDay,
    lastDay,
    rhythmTrendData: Array.from({ length: daysInCycle }, (_, index) => ({ day: index + 1, val: dailyTotals.get(index + 1) ?? 0 })),
    pieData: Array.from(categoryTotals, ([name, value]) => ({ name, value })),
    subcategoryData: Array.from(subcategoryTotals, ([name, amount], index) => ({ name, amount, fill: BAR_COLORS[index % BAR_COLORS.length] })),
  };
}
