import { billStatus, maintenanceStatus, periodKey } from "./domain";
import type { SheetsStore, RowRecord } from "./sheets";
import type { BillStatus, CarInfo, DashboardSummary, MaintenanceItem, MaintenanceStatus, RecurringBill, ServiceRecord, Transaction } from "./types";

const today = (): string => new Date().toISOString().slice(0, 10);
const id = (): string => crypto.randomUUID();

function requireDate(value: string, label: string): void { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be a valid date.`); }
function requireNonNegative(value: number, label: string): void { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`); }
function requireText(value: string, label: string): string { const trimmed = value.trim(); if (!trimmed) throw new Error(`${label} is required.`); return trimmed; }

export interface TrackerData {
  transactions: Transaction[];
  bills: BillStatus[];
  maintenance: MaintenanceStatus[];
  carInfo: CarInfo;
  serviceHistory: ServiceRecord[];
  dashboard: DashboardSummary;
}

/** Domain facade that keeps Views independent of Google Sheets row mechanics. */
export class Tracker {
  public constructor(private readonly sheets: SheetsStore) {}

  /** Loads every screen's read model in parallel. */
  public async load(): Promise<TrackerData> {
    const [transactionRows, billRows, maintenanceRows, carRows, serviceRows] = await Promise.all([
      this.sheets.list("transactions"), this.sheets.list("bills"), this.sheets.list("maintenance"), this.sheets.list("carInfo"), this.sheets.list("serviceHistory"),
    ]);
    const transactions = transactionRows.map((row) => row.data).sort((a, b) => b.date.localeCompare(a.date));
    const carInfo = carRows[0]?.data ?? { id: "", currentMileage: 0, updatedAt: "" };
    const bills = billRows.map((row) => billStatus(row.data)).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    const maintenance = maintenanceRows.map((row) => maintenanceStatus(row.data, carInfo));
    const serviceHistory = serviceRows.map((row) => row.data).sort((a, b) => b.mileage - a.mileage);
    return { transactions, bills, maintenance, carInfo, serviceHistory, dashboard: dashboard(transactions, bills) };
  }

  /** Adds a ledger transaction. */
  public async addTransaction(input: Omit<Transaction, "id" | "createdAt">): Promise<void> { requireDate(input.date, "Transaction date"); requireText(input.category, "Transaction category"); requireNonNegative(input.amount, "Transaction amount"); await this.sheets.append("transactions", { ...input, category: input.category.trim(), id: id(), createdAt: new Date().toISOString() }); }
  /** Deletes a transaction by its stable identifier. */
  public async deleteTransaction(transactionId: string): Promise<void> { await this.deleteById("transactions", transactionId); }
  /** Creates an active recurring bill. */
  public async addBill(input: Omit<RecurringBill, "id" | "active" | "lastPaidPeriod">): Promise<void> { requireText(input.name, "Bill name"); requireText(input.category, "Bill category"); requireNonNegative(input.amount, "Bill amount"); const maximum = input.recurrence === "weekly" ? 7 : input.recurrence === "yearly" ? 366 : 31; if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > maximum) throw new Error(`Due day must be between 1 and ${maximum}.`); await this.sheets.append("bills", { ...input, name: input.name.trim(), category: input.category.trim(), id: id(), active: true, lastPaidPeriod: "" }); }
  /** Records a bill payment and its matching expense transaction. */
  public async markBillPaid(billId: string): Promise<void> { const row = await this.rowById("bills", billId); const bill = { ...row.data, lastPaidPeriod: periodKey(new Date(), row.data.recurrence) }; await this.sheets.update("bills", row.rowNumber, bill); await this.addTransaction({ date: today(), type: "expense", category: bill.category, amount: bill.amount, description: `Bill payment: ${bill.name}`, paymentType: "", remarks: "" }); }
  /** Deletes a recurring bill. */
  public async deleteBill(billId: string): Promise<void> { await this.deleteById("bills", billId); }
  /** Updates the singleton current-mileage record. */
  public async setMileage(currentMileage: number): Promise<void> { requireNonNegative(currentMileage, "Current mileage"); const row = (await this.sheets.list("carInfo"))[0]; const data: CarInfo = { id: row?.data.id || id(), currentMileage, updatedAt: new Date().toISOString() }; if (row) await this.sheets.update("carInfo", row.rowNumber, data); else await this.sheets.append("carInfo", data); }
  /** Adds a maintenance item based on the current odometer baseline. */
  public async addMaintenance(input: Omit<MaintenanceItem, "id" | "active" | "lastServiceMileage">): Promise<void> { requireText(input.name, "Maintenance name"); requireDate(input.lastServiceDate, "Last-service date"); requireNonNegative(input.intervalMonths, "Month interval"); requireNonNegative(input.intervalKm, "Kilometre interval"); if (input.intervalMonths === 0 && input.intervalKm === 0) throw new Error("Set a month or kilometre interval."); const car = (await this.sheets.list("carInfo"))[0]?.data.currentMileage ?? 0; await this.sheets.append("maintenance", { ...input, name: input.name.trim(), id: id(), active: true, lastServiceMileage: car }); }
  /** Moves the maintenance baseline and optionally logs its cost as an expense. */
  public async markMaintenanceDone(itemId: string, input?: { date?: string; mileage?: number; cost?: number; category?: string }): Promise<void> { const row = await this.rowById("maintenance", itemId); const car = (await this.sheets.list("carInfo"))[0]?.data.currentMileage ?? 0; const date = input?.date || today(); const mileage = input?.mileage ?? car; await this.sheets.update("maintenance", row.rowNumber, { ...row.data, lastServiceDate: date, lastServiceMileage: mileage }); if (input?.cost && input.cost > 0) await this.addTransaction({ date, type: "expense", category: input.category || "Car Maintenance", amount: input.cost, description: `Maintenance: ${row.data.name}`, paymentType: "", remarks: "" }); }
  /** Deletes a maintenance item. */
  public async deleteMaintenance(itemId: string): Promise<void> { await this.deleteById("maintenance", itemId); }
  /** Adds a historical car-service record. */
  public async addServiceRecord(date: string, mileage: number, description: string): Promise<void> { requireDate(date, "Service date"); requireNonNegative(mileage, "Service mileage"); await this.sheets.append("serviceHistory", { id: id(), date, mileage, description: requireText(description, "Service description"), createdAt: new Date().toISOString() }); }
  /** Deletes a service-history record. */
  public async deleteServiceRecord(recordId: string): Promise<void> { await this.deleteById("serviceHistory", recordId); }

  private async rowById<K extends "transactions" | "bills" | "maintenance" | "serviceHistory">(entity: K, recordId: string): Promise<RowRecord<ExtractRecord<K>>> { const row = (await this.sheets.list(entity)).find((item) => item.data.id === recordId); if (!row) throw new Error("The requested record no longer exists."); return row as RowRecord<ExtractRecord<K>>; }
  private async deleteById<K extends "transactions" | "bills" | "maintenance" | "serviceHistory">(entity: K, recordId: string): Promise<void> { const row = await this.rowById(entity, recordId); await this.sheets.delete(entity, row.rowNumber); }
}

type ExtractRecord<K> = K extends "transactions" ? Transaction : K extends "bills" ? RecurringBill : K extends "maintenance" ? MaintenanceItem : ServiceRecord;

function dashboard(transactions: Transaction[], bills: BillStatus[]): DashboardSummary {
  const month = today().slice(0, 7);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const byCategory = new Map<string, number>();
  transactions.filter((t) => t.type === "expense").forEach((t) => byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount));
  return { month, totalIncome, totalExpense, netAmount: totalIncome - totalExpense, spendByCategory: [...byCategory].map(([category, amount]) => ({ category, amount })), bills };
}
