/**
 * Derived monetary values shown by the expense form. Keeping this calculation outside the
 * modal makes the value that is displayed, duplicate-checked, and submitted consistent.
 */
export interface ExpenseAmountSummary {
  rawAmount: number;
  feeRate: number;
  effectiveAmount: number;
}

/** Calculates the fee-inclusive amount for an expense payment method. */
export function summarizeExpenseAmount(
  amountText: string,
  paymentMethod: string,
  spayTenure: 1 | 3 | 6 | 12,
): ExpenseAmountSummary {
  const rawAmount = Number.parseFloat(amountText) || 0;
  const feeRate = paymentMethod === "SPayLater" && spayTenure > 1 ? 0.015 * spayTenure : 0;
  return {
    rawAmount,
    feeRate,
    effectiveAmount: paymentMethod === "SPayLater" ? rawAmount * (1 + feeRate) : rawAmount,
  };
}
