import { localDateKey, occurrencesInRange } from "./domain";
import type { BillStatus, CalendarEvent, MaintenanceStatus } from "./types";

/** Projects bill and maintenance schedules into the calendar's visible date range. */
export function calendarEventsInRange(
  bills: BillStatus[],
  maintenance: MaintenanceStatus[],
  start: Date,
  end: Date,
): CalendarEvent[] {
  const billEvents = bills.flatMap(({ bill, status }) =>
    occurrencesInRange(bill.dueDay, bill.recurrence, start, end).map((date) => ({
      id: `bill-${bill.id}-${localDateKey(date)}`,
      date: localDateKey(date),
      kind: "bill" as const,
      title: bill.name,
      status,
      sourceId: bill.id,
    })),
  );
  const maintenanceEvents = maintenance.flatMap(({ item, nextDueDate, status }) =>
    nextDueDate && nextDueDate >= localDateKey(start) && nextDueDate <= localDateKey(end)
      ? [{ id: `maintenance-${item.id}-${nextDueDate}`, date: nextDueDate, kind: "maintenance" as const, title: item.name, status, sourceId: item.id }]
      : [],
  );
  return [...billEvents, ...maintenanceEvents].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
