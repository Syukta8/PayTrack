import type { Transaction } from "./types";

const BAR_COLORS = ["#a855f7", "#f97316", "#ec4899", "#06b6d4", "#78350f", "#3b82f6", "#10b981"];
const RECEIPT_CATEGORIES = new Set(["Food & Dining", "Shopping", "Entertainment"]);

/** Builds the dashboard's month-level financial metrics from persisted transactions.
 * Keeping these calculations outside the view makes the totals independently testable. */
export function buildDashboardMetrics(transactions: Transaction[], yearMonth: string) {
  const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(yearMonth));
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
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
    const day = Number(transaction.date.slice(-2));
    if (Number.isInteger(day) && day >= 1 && day <= daysInMonth) {
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
    firstDay: `${yearMonth}-01`,
    lastDay: `${yearMonth}-${String(daysInMonth).padStart(2, "0")}`,
    rhythmTrendData: Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, val: dailyTotals.get(index + 1) ?? 0 })),
    pieData: Array.from(categoryTotals, ([name, value]) => ({ name, value })),
    subcategoryData: Array.from(subcategoryTotals, ([name, amount], index) => ({ name, amount, fill: BAR_COLORS[index % BAR_COLORS.length] })),
  };
}
