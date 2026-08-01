import { describe, expect, it } from "vitest";
import { finiteReceiptNumber, isRealCalendarDate, parseReceiptItems } from "./receiptParsing";

describe("receipt parsing", () => {
  it("rejects blank and malformed numeric values", () => {
    expect(finiteReceiptNumber("")).toBeNull();
    expect(finiteReceiptNumber("RM 12.50")).toBe(12.5);
    expect(finiteReceiptNumber("NaN")).toBeNull();
  });

  it("keeps only complete line items and derives a missing total", () => {
    expect(parseReceiptItems([{ name: " Tea ", qty: "2", unitPrice: "3" }, { name: "", totalPrice: 1 }, null]))
      .toEqual([{ name: "Tea", qty: 2, unitPrice: 3, totalPrice: 6, category: undefined }]);
  });

  it("recognizes calendar dates without accepting rollover dates", () => {
    expect(isRealCalendarDate("2024-02-29")).toBe(true);
    expect(isRealCalendarDate("2026-02-29")).toBe(false);
  });
});
