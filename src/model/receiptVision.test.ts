import { describe, expect, it } from "vitest";
import { QUALITY_MESSAGE, validateReceipt } from "./receiptVision";

const readableReceipt = {
  merchantName: "Kedai Makan", totalAmount: "12.50", date: "2026-07-31",
  category: "Food & Dining", paymentMethod: "duitnow qr", note: "Lunch",
  items: [{ name: "Nasi lemak", qty: "2", unitPrice: "5", totalPrice: "10" }],
};

describe("validateReceipt", () => {
  it("normalizes valid receipts before they can enter the ledger", () => {
    const outcome = validateReceipt(readableReceipt);
    expect(outcome).toMatchObject({ ok: true });
    if (outcome.ok) {
      expect(outcome.receipt.paymentMethod).toBe("QR code");
      expect(outcome.receipt.items[0]).toMatchObject({ qty: 2, totalPrice: 10 });
    }
  });

  it("rejects low-quality and invalid totals", () => {
    expect(validateReceipt({ ...readableReceipt, isQualityLow: true })).toEqual({ ok: false, reason: QUALITY_MESSAGE });
    expect(validateReceipt({ ...readableReceipt, totalAmount: "not money" })).toEqual({ ok: false, reason: QUALITY_MESSAGE });
  });
});
