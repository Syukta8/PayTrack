import { describe, expect, it } from "vitest";
import { billStatus, dueDateFor, localDateKey, maintenanceStatus, occurrencesInRange, periodKey } from "./domain";

const item = { id: "oil", name: "Oil", notes: "", intervalMonths: 6, intervalKm: 5000, lastServiceDate: "2026-02-01", lastServiceMileage: 10000, active: true };

describe("maintenanceStatus", () => {
  it("marks mileage and date thresholds as due soon", () => {
    expect(maintenanceStatus(item, { id: "car", currentMileage: 14550, updatedAt: "" }, new Date(2026, 6, 25)))
      .toMatchObject({ nextDueDate: "2026-08-01", kmUntilDue: 450, status: "due_soon" });
  });

  it("marks either overdue threshold as overdue", () => {
    expect(maintenanceStatus(item, { id: "car", currentMileage: 15100, updatedAt: "" }, new Date(2026, 6, 25)).status).toBe("overdue");
  });

  it("supports date-only and mileage-only maintenance schedules", () => {
    expect(maintenanceStatus({ ...item, intervalMonths: 0, intervalKm: 0 }, { id: "car", currentMileage: 10000, updatedAt: "" }, new Date(2026, 6, 25)))
      .toMatchObject({ nextDueDate: null, nextDueMileage: null, status: "upcoming" });
    expect(maintenanceStatus({ ...item, intervalMonths: 0 }, { id: "car", currentMileage: 15001, updatedAt: "" }, new Date(2026, 6, 25)).status).toBe("overdue");
  });
});

describe("recurring bill calendar rules", () => {
  const bill = { id: "bill", name: "Internet", amount: 99, category: "Bills & Utilities", dueDay: 31, recurrence: "monthly" as const, lastPaidPeriod: "", active: true };

  it("clamps impossible due days and gives each recurrence a stable period key", () => {
    expect(localDateKey(dueDateFor(new Date(2026, 1, 10), 31, "monthly"))).toBe("2026-02-28");
    expect(localDateKey(dueDateFor(new Date(2026, 0, 10), 8, "weekly"))).toBe("2026-01-11");
    expect(periodKey(new Date(2026, 7, 5), "monthly")).toBe("2026-08");
    expect(periodKey(new Date(2026, 7, 5), "weekly")).toBe("2026-08-03");
    expect(periodKey(new Date(2026, 7, 5), "yearly")).toBe("2026");
  });

  it("marks paid, overdue, due-soon, and upcoming bills", () => {
    const now = new Date(2026, 7, 10);
    expect(billStatus({ ...bill, dueDay: 10, lastPaidPeriod: "2026-08" }, now).status).toBe("paid");
    expect(billStatus({ ...bill, dueDay: 9 }, now).status).toBe("overdue");
    expect(billStatus({ ...bill, dueDay: 14 }, now).status).toBe("due_soon");
    expect(billStatus({ ...bill, dueDay: 20 }, now).status).toBe("upcoming");
  });

  it("expands weekly, monthly, and yearly occurrences inside the requested range", () => {
    expect(occurrencesInRange(2, "weekly", new Date(2026, 7, 1), new Date(2026, 7, 15)).map(localDateKey))
      .toEqual(["2026-08-04", "2026-08-11"]);
    expect(occurrencesInRange(31, "monthly", new Date(2026, 1, 1), new Date(2026, 3, 30)).map(localDateKey))
      .toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(occurrencesInRange(60, "yearly", new Date(2024, 0, 1), new Date(2026, 11, 31)).map(localDateKey))
      .toEqual(["2024-01-31", "2025-01-31", "2026-01-31"]);
  });
});
