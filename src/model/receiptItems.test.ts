import { describe, expect, it } from "vitest";
import { restoreLegacyReceiptItems } from "./receiptItems";

describe("restoreLegacyReceiptItems", () => {
  it("restores valid legacy items without changing their category", () => {
    expect(restoreLegacyReceiptItems({ category: "Food & Dining", remarks: "note | ITEMS: [{\"n\":\"Tea\",\"q\":2,\"p\":2,\"t\":4}]" }))
      .toMatchObject([{ name: "Tea", qty: 2, totalPrice: 4, category: "Food & Dining" }]);
  });

  it("ignores malformed legacy data", () => {
    expect(restoreLegacyReceiptItems({ category: "Food & Dining", remarks: "note | ITEMS: not-json" })).toEqual([]);
  });
});
