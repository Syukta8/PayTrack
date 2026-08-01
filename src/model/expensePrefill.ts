import { normalizePaymentType } from "./types";
import type { ReceiptItem } from "./types";

/** Scanner and SMS fields accepted by the add-transaction form. Optional values deliberately
 * remain optional so an incomplete extraction cannot overwrite a user's in-progress input. */
export interface ExpensePrefillSource {
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  note?: string;
  imageUrl?: string;
  paymentMethod?: string;
  tax?: number;
  serviceCharge?: number;
  items?: ReceiptItem[];
}

/** Normalizes a scanner result into values safe for the editable expense form. */
export function buildExpensePrefill(source: ExpensePrefillSource) {
  return {
    amountStr: source.amount === undefined ? undefined : String(source.amount),
    category: source.category,
    date: source.date,
    note: source.description || source.note,
    payment: normalizePaymentType(source.paymentMethod) ?? undefined,
    imageUrl: source.imageUrl,
    items: source.items,
    tax: source.tax ?? 0,
    serviceCharge: source.serviceCharge ?? 0,
  };
}
