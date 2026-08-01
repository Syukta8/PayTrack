import { describe, expect, it, vi } from "vitest";
import { submitTransactionDraft } from "./transactionSubmission";
import type { Transaction } from "./types";

describe("submitTransactionDraft", () => {
  it("writes sheet-safe fields and keeps the receipt image device-local", async () => {
    const addTransaction = vi.fn<(_: Omit<Transaction, "id" | "createdAt">) => Promise<string>>().mockResolvedValue("tx-1");
    const saveImage = vi.fn(async () => undefined);
    await submitTransactionDraft(
      { addTransaction },
      { type: "expense", amount: 12, category: "Food & Dining", paymentMethod: "Cash", date: "2026-08-01", note: "Lunch" },
      { imageUrl: "data:image/jpeg;base64,receipt", tax: 1, items: [{ id: "item-1", name: "Tea", qty: 1, unitPrice: 2, totalPrice: 2 }] },
      saveImage,
    );
    expect(addTransaction).toHaveBeenCalledWith(expect.objectContaining({ remarks: "", tax: 1, items: expect.any(Array) }));
    expect(saveImage).toHaveBeenCalledWith("tx-1", "data:image/jpeg;base64,receipt");
  });
});
