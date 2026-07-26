import type { SheetEntity, SheetRecord } from "./sheetSchema";
import type { RowRecord, SheetsStore } from "./sheets";

// Bumped whenever the seed shape changes: stored demo data from an older shape would be
// missing an entity array and break every read.
const KEY = "paytrack.demo.data.v5";
type DemoData = { [K in SheetEntity]: SheetRecord<K>[] };

function id(value: string): string { return `demo-${value}`; }
function seed(): DemoData { 
  const currentMonthDate = `${new Date().toISOString().slice(0, 7)}-12`;
  const mayDate = "2026-05-27";

  return {
    transactions: [
      // May 2026 PDF Records
      [mayDate, "income", "Salary", 3203.45, "gaji mei", "Online banking"],
      [mayDate, "expense", "Bills & Utilities", 250.00, "installment forte", "Online banking"],
      [mayDate, "expense", "Personal", 200.00, "bulanan mak", "Online banking"],
      [mayDate, "expense", "Personal", 150.00, "bulanan ayah", "Online banking"],
      [mayDate, "expense", "Food & Dining", 20.90, "ayam gepuk seremban 3", "Debit card"],
      [mayDate, "expense", "Bills & Utilities", 864.60, "spaylater", "Online banking"],
      [mayDate, "expense", "Food & Dining", 27.00, "lauk pasar tani", "QR code"],
      [mayDate, "expense", "Personal", 9.00, "dobi bubblelab", "QR code"],
      [mayDate, "expense", "Food & Dining", 7.90, "fries mydin", "QR code"],
      [mayDate, "expense", "Personal", 20.00, "tombol pintu", "QR code"],
      [mayDate, "expense", "Food & Dining", 20.00, "mi bandung x2", "QR code"],
      [mayDate, "expense", "Transport", 28.78, "tol balik muar", "QR code"],
      [mayDate, "expense", "Bills & Utilities", 10.78, "bil air", "Online banking"],
      [mayDate, "expense", "Bills & Utilities", 50.00, "bil letrik", "Online banking"],
      [mayDate, "expense", "Food & Dining", 8.90, "apple", "Online banking"],
      [mayDate, "expense", "Transport", 30.00, "shell kesang laut", "QR code"],
      [mayDate, "expense", "Food & Dining", 9.60, "gula2 station minyak", "QR code"],

      // Current Month Records
      [currentMonthDate, "income", "Salary", 3203.45, "gaji bulan ini", "Online banking"],
      [currentMonthDate, "expense", "Bills & Utilities", 250.00, "Unifi fiber", "Online banking"],
      [currentMonthDate, "expense", "Personal", 200.00, "shopping & personal", "Online banking"],
      [currentMonthDate, "expense", "Food & Dining", 20.90, "nasi kandar", "Debit card"],
      [currentMonthDate, "expense", "Bills & Utilities", 50.00, "bil letrik", "Online banking"],
      [currentMonthDate, "expense", "Transport", 30.00, "petronas fuel", "QR code"],
    ].map(([date, type, category, amount, description, paymentType], index) => ({
      id: id(`transaction-${index}`),
      date: String(date),
      type: type as "income" | "expense",
      category: String(category),
      amount: Number(amount),
      description: String(description),
      paymentType: String(paymentType),
      remarks: "",
      createdAt: `${date}T09:18:00.000Z`,
      imageUrl: "",
      driveUrl: "",
    })),
    bills: [{ id: id("bill-forte"), name: "Unifi Fiber", amount: 250, category: "Bills & Utilities", dueDay: 1, recurrence: "monthly" as const, lastPaidPeriod: "", active: true }],
    maintenance: [{ id: id("maintenance-oil"), name: "Engine oil", notes: "Full synthetic and oil filter", intervalMonths: 6, intervalKm: 10000, lastServiceDate: "2026-04-26", lastServiceMileage: 198203, active: true }],
    carInfo: [{ id: id("car"), currentMileage: 204974, updatedAt: "2026-08-16T00:00:00.000Z" }],
    receiptItems: [],
    serviceHistory: [{ id: id("service-1"), date: "2025-04-26", mileage: 198203, description: "Change full synthetic and oil filter", createdAt: "2025-04-26T00:00:00.000Z" }, { id: id("service-2"), date: "2025-08-16", mileage: 204974, description: "Brake shoe, brake pads, balancing and alignment", createdAt: "2025-08-16T00:00:00.000Z" }],
  }; 
}

/** Local-only Sheets substitute for UI debugging; it never contacts Firebase or Google. */
export class DemoSheetsRepository implements SheetsStore {
  private read(): DemoData { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as DemoData : seed(); }
  private write(data: DemoData): void { localStorage.setItem(KEY, JSON.stringify(data)); }
  public async list<K extends SheetEntity>(entity: K): Promise<RowRecord<SheetRecord<K>>[]> { return this.read()[entity].map((data, index) => ({ rowNumber: index + 2, data })); }
  public async append<K extends SheetEntity>(entity: K, record: SheetRecord<K>): Promise<void> { const data = this.read(); data[entity].push(record); this.write(data); }
  public async appendMany<K extends SheetEntity>(entity: K, records: SheetRecord<K>[]): Promise<void> { if (!records.length) return; const data = this.read(); data[entity].push(...records); this.write(data); }
  public async update<K extends SheetEntity>(entity: K, rowNumber: number, record: SheetRecord<K>): Promise<void> { const data = this.read(); data[entity][rowNumber - 2] = record; this.write(data); }
  public async delete(entity: SheetEntity, rowNumber: number): Promise<void> { const data = this.read(); data[entity].splice(rowNumber - 2, 1); this.write(data); }
  /** Splices bottom-up so the lower indices stay valid, matching the Sheets behaviour. */
  public async deleteMany(entity: SheetEntity, rowNumbers: number[]): Promise<void> { const targets = [...new Set(rowNumbers)].sort((a, b) => b - a); if (!targets.length) return; const data = this.read(); targets.forEach((rowNumber) => data[entity].splice(rowNumber - 2, 1)); this.write(data); }
}
