import type { Transaction } from "./types";

/** A calculated, browser-local view of one SPayLater payment schedule. */
export interface BnplPlan {
  tenureMonths: number;
  monthlyAmount: number;
  paidMonths: number[];
  progressPct: number;
  schedule: { monthNum: number; date: string; isPaid: boolean }[];
}

/** Builds a payment schedule from one ledger transaction and its local paid-month cache. */
export function buildBnplPlan(item: Transaction, storedPaidMonths: string | null): BnplPlan {
  const match = `${item.paymentType} ${item.description} ${item.remarks || ""}`.match(/SPayLater\s*(\d+)M/i);
  const tenureMonths = match ? Number.parseInt(match[1], 10) : 1;
  let parsedPaidMonths: unknown = [1];
  try {
    parsedPaidMonths = storedPaidMonths ? JSON.parse(storedPaidMonths) : [1];
  } catch {
    // A stale local cache must never prevent the ledger from rendering.
  }
  const paidMonths = Array.isArray(parsedPaidMonths)
    ? parsedPaidMonths.filter((month): month is number => Number.isInteger(month) && month >= 1 && month <= tenureMonths)
    : [1];
  const baseDateParts = item.date.split("-").map(Number);
  const schedule = Array.from({ length: tenureMonths }, (_, index) => {
    const date = new Date(baseDateParts[0] || new Date().getFullYear(), (baseDateParts[1] || 1) - 1 + index, baseDateParts[2] || 1);
    const monthNum = index + 1;
    return { monthNum, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, isPaid: paidMonths.includes(monthNum) };
  });
  return { tenureMonths, monthlyAmount: item.amount / tenureMonths, paidMonths, progressPct: Math.min(100, Math.round((paidMonths.length / tenureMonths) * 100)), schedule };
}
