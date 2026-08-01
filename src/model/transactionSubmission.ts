import { saveReceiptImage } from "./imageStore";
import type { ExpensePrefillSource } from "./expensePrefill";
import type { ReceiptItem, Transaction } from "./types";

/** Complete user-entered values accepted by the add-transaction modal. */
export interface TransactionDraft {
  type: "expense" | "income";
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  note: string;
  imageUrl?: string;
  tax?: number;
  serviceCharge?: number;
  items?: ReceiptItem[];
}

interface TransactionWriter {
  addTransaction(input: Omit<Transaction, "id" | "createdAt">): Promise<string>;
}

/** Writes a ledger entry and its device-local receipt image. Receipt line items remain in the
 * sheet-backed transaction workflow, while the image is intentionally retained only locally. */
export async function submitTransactionDraft(
  tracker: TransactionWriter,
  draft: TransactionDraft,
  scanned: ExpensePrefillSource | null,
  saveImage: (id: string, image: string) => Promise<void> = saveReceiptImage,
): Promise<void> {
  const image = draft.imageUrl ?? scanned?.imageUrl;
  const items = draft.items ?? scanned?.items;
  const id = await tracker.addTransaction({
    date: draft.date,
    type: draft.type,
    amount: draft.amount,
    category: draft.category,
    paymentType: draft.paymentMethod,
    description: draft.note,
    remarks: "",
    tax: draft.tax ?? scanned?.tax ?? 0,
    serviceCharge: draft.serviceCharge ?? scanned?.serviceCharge ?? 0,
    items,
  });
  if (id && image) await saveImage(id, image);
}
