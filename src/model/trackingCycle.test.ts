import { describe, expect, it } from "vitest";
import { trackingCycleForDate } from "./trackingCycle";

describe("trackingCycleForDate", () => {
  it("clamps a 31st-day cycle for February without moving the transaction date", () => {
    expect(trackingCycleForDate("2026-02-28", 31)).toEqual({ start: "2026-02-28", end: "2026-03-30" });
    expect(trackingCycleForDate("2026-02-27", 31)).toEqual({ start: "2026-01-31", end: "2026-02-27" });
  });
});
