import { describe, expect, it } from "vitest";
import { normalizePaymentType } from "./types";

describe("normalizePaymentType", () => {
  it("preserves canonical payment types and folds legacy aliases", () => {
    expect(normalizePaymentType("Debit card")).toBe("Debit card");
    expect(normalizePaymentType("duitnow qr")).toBe("QR code");
    expect(normalizePaymentType("Bank Transfer")).toBe("Online banking");
  });

  it("rejects missing and unknown payment types", () => {
    expect(normalizePaymentType(" ")).toBeNull();
    expect(normalizePaymentType("Crypto")).toBeNull();
  });
});
