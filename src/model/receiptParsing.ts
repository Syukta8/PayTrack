import type { ScannedItem } from "./receiptVision";

/** Parses a currency-like scalar without treating blank or malformed input as zero. */
export function finiteReceiptNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Returns whether a date string describes a real calendar day. */
export function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Formats today's date in the user's local calendar rather than UTC. */
export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Converts only complete, financially safe scanner line items into ledger-ready values. */
export function parseReceiptItems(value: unknown): ScannedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const qty = finiteReceiptNumber(item.qty);
    const unitPrice = finiteReceiptNumber(item.unitPrice);
    const totalPrice = finiteReceiptNumber(item.totalPrice) ?? (qty !== null && unitPrice !== null ? qty * unitPrice : null);
    if (!name || totalPrice === null || totalPrice < 0) return [];
    return [{
      name,
      qty: qty !== null && qty > 0 ? qty : 1,
      unitPrice: unitPrice !== null && unitPrice >= 0 ? unitPrice : totalPrice,
      totalPrice,
      category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : undefined,
    }];
  });
}
