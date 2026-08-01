import type { PaymentType } from "./types";

/** Ledger fields derived from a bank-notification message before the user reviews them. */
export interface ParsedSmsExpense {
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: PaymentType;
}

const CATEGORY_MATCHERS: Array<[RegExp, string]> = [
  [/food|kopitiam|restaurant|mcd|kfc|starbucks|zus|grabfood|foodpanda/i, "Food & Dining"],
  [/petronas|shell|caltex|toll|touch n go|tng/i, "Transport"],
  [/unifi|tnb|syabas|air|electricity|utility/i, "Bills & Utilities"],
  [/shopee|lazada|mydin|lotus|watson|guardian/i, "Shopping"],
];

function paymentMethodFor(text: string): PaymentType {
  if (/spaylater/i.test(text)) return "SPayLater";
  if (/qr|duitnow/i.test(text)) return "QR code";
  if (/credit/i.test(text)) return "Credit card";
  if (/debit|card/i.test(text)) return "Debit card";
  return "Online banking";
}

/** Parses safe advisory defaults from an SMS. It never saves or blocks an expense. */
export function parseSmsExpense(text: string, date = new Date()): ParsedSmsExpense {
  const amountMatch = text.match(/(?:RM|MYR)?\s*(\d+(?:\.\d{1,2})?)/i);
  const category = CATEGORY_MATCHERS.find(([matcher]) => matcher.test(text))?.[1] ?? "Personal";
  const description = text.split("\n").map((line) => line.trim()).find(Boolean)?.slice(0, 35) || "SMS Captured Expense";
  return {
    amount: amountMatch ? Number(amountMatch[1]) : 0,
    category,
    description,
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    paymentMethod: paymentMethodFor(text),
  };
}
