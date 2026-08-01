import { describe, expect, it } from "vitest";
import { coerceCellValue } from "./sheets";

describe("coerceCellValue", () => {
  it("uses schema-safe defaults for blank cells", () => {
    expect(coerceCellValue(undefined, "number")).toBe(0);
    expect(coerceCellValue("", "boolean")).toBe(false);
    expect(coerceCellValue("", "string")).toBe("");
  });

  it("normalizes boolean and numeric values", () => {
    expect(coerceCellValue("TRUE", "boolean")).toBe(true);
    expect(coerceCellValue("12.5", "number")).toBe(12.5);
  });
});
