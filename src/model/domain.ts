import type { BillStatus, MaintenanceStatus, Recurrence, RecurringBill, MaintenanceItem, CarInfo } from "./types";

const DAY_MS = 86_400_000;

function mondayOf(date: Date): Date { const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate()); copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7)); return copy; }

/** Returns the stable payment period used to prevent a bill being paid twice. */
export function periodKey(date: Date, recurrence: Recurrence): string {
  if (recurrence === "yearly") return String(date.getFullYear());
  if (recurrence === "weekly") return mondayOf(date).toISOString().slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Computes the due date within a recurrence period, clamping dates such as 31 February. */
export function dueDateFor(date: Date, dueDay: number, recurrence: Recurrence): Date {
  if (recurrence === "weekly") { const due = mondayOf(date); due.setDate(due.getDate() + Math.max(0, Math.min(6, dueDay - 1))); return due; }
  if (recurrence === "yearly") return new Date(date.getFullYear(), 0, Math.min(Math.max(1, dueDay), new Date(date.getFullYear(), 1, 0).getDate()));
  return new Date(date.getFullYear(), date.getMonth(), Math.min(Math.max(1, dueDay), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
}

/** Derives a bill's current payment status. */
export function billStatus(bill: RecurringBill, now = new Date()): BillStatus {
  const due = dueDateFor(now, bill.dueDay, bill.recurrence);
  const paid = bill.lastPaidPeriod === periodKey(now, bill.recurrence);
  const daysUntilDue = Math.round((due.getTime() - now.getTime()) / DAY_MS);
  return { bill, dueDate: due.toISOString().slice(0, 10), daysUntilDue, isPaidForCurrentPeriod: paid, status: paid ? "paid" : daysUntilDue < 0 ? "overdue" : daysUntilDue <= 5 ? "due_soon" : "upcoming" };
}

/** Applies the date/mileage "whichever comes first" rule to a maintenance item. */
export function maintenanceStatus(item: MaintenanceItem, carInfo: CarInfo, now = new Date()): MaintenanceStatus {
  const dueDate = item.intervalMonths > 0 && item.lastServiceDate ? new Date(new Date(item.lastServiceDate).getFullYear(), new Date(item.lastServiceDate).getMonth() + item.intervalMonths, new Date(item.lastServiceDate).getDate()) : null;
  const daysUntilDue = dueDate ? Math.round((dueDate.getTime() - now.getTime()) / DAY_MS) : null;
  const nextDueMileage = item.intervalKm > 0 ? item.lastServiceMileage + item.intervalKm : null;
  const kmUntilDue = nextDueMileage === null ? null : nextDueMileage - carInfo.currentMileage;
  const overdue = (daysUntilDue !== null && daysUntilDue < 0) || (kmUntilDue !== null && kmUntilDue < 0);
  const dueSoon = (daysUntilDue !== null && daysUntilDue <= 7) || (kmUntilDue !== null && kmUntilDue <= 500);
  return { item, nextDueDate: dueDate?.toISOString().slice(0, 10) ?? null, daysUntilDue, nextDueMileage, kmUntilDue, status: overdue ? "overdue" : dueSoon ? "due_soon" : "upcoming" };
}
