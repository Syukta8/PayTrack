import type { BillStatus, MaintenanceStatus, Recurrence, RecurringBill, MaintenanceItem, CarInfo } from "./types";

const DAY_MS = 86_400_000;

function mondayOf(date: Date): Date { const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate()); copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7)); return copy; }

/** Formats a local calendar date without UTC conversion, preserving the user's day. */
export function localDateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

/** Returns the stable payment period used to prevent a bill being paid twice. */
export function periodKey(date: Date, recurrence: Recurrence): string {
  if (recurrence === "yearly") return String(date.getFullYear());
  if (recurrence === "weekly") return localDateKey(mondayOf(date));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Computes the due date within a recurrence period, clamping dates such as 31 February. */
export function dueDateFor(date: Date, dueDay: number, recurrence: Recurrence): Date {
  if (recurrence === "weekly") { const due = mondayOf(date); due.setDate(due.getDate() + Math.max(0, Math.min(6, dueDay - 1))); return due; }
  if (recurrence === "yearly") return new Date(date.getFullYear(), 0, Math.min(Math.max(1, dueDay), new Date(date.getFullYear(), 1, 0).getDate()));
  return new Date(date.getFullYear(), date.getMonth(), Math.min(Math.max(1, dueDay), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
}

/** Expands a recurring bill into concrete dates inside an inclusive calendar range. */
export function occurrencesInRange(dueDay: number, recurrence: Recurrence, start: Date, end: Date): Date[] {
  const results: Date[] = [];
  if (recurrence === "weekly") {
    let cursor = mondayOf(start);
    while (cursor <= end) { const due = dueDateFor(cursor, dueDay, recurrence); if (due >= start && due <= end) results.push(due); cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7); }
    return results;
  }
  if (recurrence === "monthly") {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1); const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) { const due = dueDateFor(cursor, dueDay, recurrence); if (due >= start && due <= end) results.push(due); cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); }
    return results;
  }
  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) { const due = dueDateFor(new Date(year, 0, 1), dueDay, recurrence); if (due >= start && due <= end) results.push(due); }
  return results;
}

/** Derives a bill's current payment status. */
export function billStatus(bill: RecurringBill, now = new Date()): BillStatus {
  const due = dueDateFor(now, bill.dueDay, bill.recurrence);
  const paid = bill.lastPaidPeriod === periodKey(now, bill.recurrence);
  const daysUntilDue = Math.round((due.getTime() - now.getTime()) / DAY_MS);
  return { bill, dueDate: localDateKey(due), daysUntilDue, isPaidForCurrentPeriod: paid, status: paid ? "paid" : daysUntilDue < 0 ? "overdue" : daysUntilDue <= 5 ? "due_soon" : "upcoming" };
}

/** Applies the date/mileage "whichever comes first" rule to a maintenance item. */
export function maintenanceStatus(item: MaintenanceItem, carInfo: CarInfo, now = new Date()): MaintenanceStatus {
  const dueDate = nextServiceDate(item);
  const daysUntilDue = dueDate ? Math.round((dueDate.getTime() - now.getTime()) / DAY_MS) : null;
  const nextDueMileage = item.intervalKm > 0 ? item.lastServiceMileage + item.intervalKm : null;
  const kmUntilDue = nextDueMileage === null ? null : nextDueMileage - carInfo.currentMileage;
  const overdue = (daysUntilDue !== null && daysUntilDue < 0) || (kmUntilDue !== null && kmUntilDue < 0);
  const dueSoon = (daysUntilDue !== null && daysUntilDue <= 7) || (kmUntilDue !== null && kmUntilDue <= 500);
  return { item, nextDueDate: dueDate ? localDateKey(dueDate) : null, daysUntilDue, nextDueMileage, kmUntilDue, status: overdue ? "overdue" : dueSoon ? "due_soon" : "upcoming" };
}

/** Returns the next calendar service date when the item has a date-based interval. */
function nextServiceDate(item: MaintenanceItem): Date | null {
  if (item.intervalMonths <= 0 || !item.lastServiceDate) return null;
  const last = new Date(item.lastServiceDate);
  return new Date(last.getFullYear(), last.getMonth() + item.intervalMonths, last.getDate());
}
