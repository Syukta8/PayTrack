import { describe, expect, it } from "vitest";
import { buildExpensePrefill } from "./expensePrefill";

describe("buildExpensePrefill", () => {
  it("preserves a zero amount and normalizes scanner payment labels", () => {
    expect(buildExpensePrefill({ amount: 0, description: "Lunch", paymentMethod: "duitnow qr" }))
      .toMatchObject({ amountStr: "0", note: "Lunch", payment: "QR code", tax: 0, serviceCharge: 0 });
  });
});
