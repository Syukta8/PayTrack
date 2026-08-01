import { describe, expect, it } from "vitest";
import { maintenanceStatus } from "./domain";

const item = { id: "oil", name: "Oil", notes: "", intervalMonths: 6, intervalKm: 5000, lastServiceDate: "2026-02-01", lastServiceMileage: 10000, active: true };

describe("maintenanceStatus", () => {
  it("marks mileage and date thresholds as due soon", () => {
    expect(maintenanceStatus(item, { id: "car", currentMileage: 14550, updatedAt: "" }, new Date(2026, 6, 25)))
      .toMatchObject({ nextDueDate: "2026-08-01", kmUntilDue: 450, status: "due_soon" });
  });

  it("marks either overdue threshold as overdue", () => {
    expect(maintenanceStatus(item, { id: "car", currentMileage: 15100, updatedAt: "" }, new Date(2026, 6, 25)).status).toBe("overdue");
  });
});
