import type { SheetEntity, SheetRecord } from "./sheetSchema";
import type { RowRecord, SheetsStore } from "./sheets";

const KEY = "paytrack.demo.data";
type DemoData = { [K in SheetEntity]: SheetRecord<K>[] };

function id(value: string): string { return `demo-${value}`; }
function seed(): DemoData { return {
  categories: [...["Salary", "Savings"].map((name, index) => ({ id: id(`income-${index}`), name, type: "income" as const })), ...["Family", "Personal+Food", "Subscription", "Minyak", "Installment Forte", "Car Maintenance"].map((name, index) => ({ id: id(`expense-${index}`), name, type: "expense" as const }))],
  budgets: [["Family", 300], ["Personal+Food", 919.43], ["Subscription", 30.9], ["Minyak", 200], ["Installment Forte", 250]].map(([category, monthlyLimit], index) => ({ id: id(`budget-${index}`), category: String(category), monthlyLimit: Number(monthlyLimit) })),
  transactions: [
    ["2026-04-27", "income", "Salary", 3203.45, "gaji april", "Online banking"], ["2026-04-27", "expense", "Installment Forte", 250, "installment forte masuk asb", "Online banking"], ["2026-04-27", "expense", "Family", 200, "bulanan mak", "Online banking"], ["2026-04-27", "expense", "Personal+Food", 20.9, "ayam gepuk seremban 3", "Debit card"], ["2026-04-27", "expense", "Subscription", 50, "bil letrik", "Online banking"], ["2026-04-27", "expense", "Minyak", 30, "shell kesang laut", "Qr code"],
  ].map(([date, type, category, amount, description, paymentType], index) => ({ id: id(`transaction-${index}`), date: String(date), type: type as "income" | "expense", category: String(category), amount: Number(amount), description: String(description), paymentType: String(paymentType), remarks: "", createdAt: "2026-04-27T09:18:00.000Z" })),
  bills: [{ id: id("bill-forte"), name: "Installment Forte", amount: 250, category: "Installment Forte", dueDay: 1, recurrence: "monthly" as const, lastPaidPeriod: "", active: true }],
  maintenance: [{ id: id("maintenance-oil"), name: "Engine oil", notes: "Full synthetic and oil filter", intervalMonths: 6, intervalKm: 10000, lastServiceDate: "2026-04-26", lastServiceMileage: 198203, active: true }],
  carInfo: [{ id: id("car"), currentMileage: 204974, updatedAt: "2026-08-16T00:00:00.000Z" }],
  serviceHistory: [{ id: id("service-1"), date: "2025-04-26", mileage: 198203, description: "Change full synthetic and oil filter", createdAt: "2025-04-26T00:00:00.000Z" }, { id: id("service-2"), date: "2025-08-16", mileage: 204974, description: "Brake shoe, brake pads, balancing and alignment", createdAt: "2025-08-16T00:00:00.000Z" }],
}; }

/** Local-only Sheets substitute for UI debugging; it never contacts Firebase or Google. */
export class DemoSheetsRepository implements SheetsStore {
  private read(): DemoData { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as DemoData : seed(); }
  private write(data: DemoData): void { localStorage.setItem(KEY, JSON.stringify(data)); }
  public async list<K extends SheetEntity>(entity: K): Promise<RowRecord<SheetRecord<K>>[]> { return this.read()[entity].map((data, index) => ({ rowNumber: index + 2, data })); }
  public async append<K extends SheetEntity>(entity: K, record: SheetRecord<K>): Promise<void> { const data = this.read(); data[entity].push(record); this.write(data); }
  public async update<K extends SheetEntity>(entity: K, rowNumber: number, record: SheetRecord<K>): Promise<void> { const data = this.read(); data[entity][rowNumber - 2] = record; this.write(data); }
  public async delete(entity: SheetEntity, rowNumber: number): Promise<void> { const data = this.read(); data[entity].splice(rowNumber - 2, 1); this.write(data); }
}
