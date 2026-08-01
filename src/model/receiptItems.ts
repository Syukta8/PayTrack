import type { ReceiptItem, Transaction } from "./types";

/** Restores the compact line-item payload written by older PayTrack versions.
 * Current receipts use the ReceiptItems sheet tab; malformed legacy data is ignored rather
 * than being guessed and displayed as a financial record. */
export function restoreLegacyReceiptItems(receipt: Pick<Transaction, "remarks" | "category">): ReceiptItem[] {
  if (!receipt.remarks.includes("| ITEMS:")) return [];

  try {
    const rawJson = receipt.remarks.split("| ITEMS:")[1]?.trim();
    const parsed = rawJson ? JSON.parse(rawJson) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value, index) => {
      if (!value || typeof value !== "object") return [];
      const item = value as { n?: unknown; q?: unknown; p?: unknown; t?: unknown };
      const totalPrice = typeof item.t === "number" && Number.isFinite(item.t) ? item.t : 0;
      return [{
        id: `item_restored_${index}`,
        name: typeof item.n === "string" && item.n.trim() ? item.n : `Item #${index + 1}`,
        qty: typeof item.q === "number" && item.q > 0 ? item.q : 1,
        unitPrice: typeof item.p === "number" && item.p >= 0 ? item.p : 0,
        totalPrice,
        category: receipt.category,
      }];
    });
  } catch {
    return [];
  }
}
