import { describe, expect, it } from "vitest";
import { calendarEventsInRange } from "./calendarEvents";

describe("calendarEventsInRange", () => {
  it("keeps recurring bill occurrences calendar-based alongside maintenance due dates", () => {
    const events = calendarEventsInRange(
      [{ bill: { id: "internet", name: "Internet", amount: 99, category: "Bills", dueDay: 1, recurrence: "monthly", lastPaidPeriod: "", active: true }, dueDate: "2026-08-01", daysUntilDue: 0, isPaidForCurrentPeriod: false, status: "due_soon" }],
      [{ item: { id: "oil", name: "Oil service", notes: "", intervalMonths: 6, intervalKm: 0, lastServiceDate: "2026-02-10", lastServiceMileage: 0, active: true }, nextDueDate: "2026-08-10", daysUntilDue: 9, nextDueMileage: null, kmUntilDue: null, status: "upcoming" }],
      new Date(2026, 7, 1),
      new Date(2026, 7, 31),
    );

    expect(events).toMatchObject([{ date: "2026-08-01", kind: "bill", title: "Internet" }, { date: "2026-08-10", kind: "maintenance", title: "Oil service" }]);
  });
});
