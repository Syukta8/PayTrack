import { describe, expect, it, vi } from "vitest";
import { Tracker } from "./tracker";
import type { RowRecord, SheetsStore } from "./sheets";
import type { SheetEntity, SheetRecord } from "./sheetSchema";

type Rows = { [K in SheetEntity]: RowRecord<SheetRecord<K>>[] };

function createSheets(rows: Partial<Rows> = {}) {
  const allRows: Rows = {
    transactions: [], bills: [], maintenance: [], carInfo: [], serviceHistory: [], receiptItems: [],
    ...rows,
  } as Rows;
  return {
    list: vi.fn(async <K extends SheetEntity>(entity: K) => allRows[entity]),
    append: vi.fn(async () => undefined),
    appendMany: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    delete: vi.fn(async () => undefined),
    deleteMany: vi.fn(async () => undefined),
  } as unknown as SheetsStore & { [K in keyof SheetsStore]: ReturnType<typeof vi.fn> };
}

const transaction = {
  id: "txn-1", date: "2026-08-01", type: "expense" as const, category: "Food & Dining",
  amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "",
};

describe("Tracker", () => {
  it("loads sorted transactions and joins receipt items from their dedicated tab", async () => {
    const sheets = createSheets({
      transactions: [{ rowNumber: 2, data: transaction }, { rowNumber: 3, data: { ...transaction, id: "txn-2", date: "2026-08-02", type: "income", category: "Salary", amount: 100 } }],
      receiptItems: [{ rowNumber: 2, data: { id: "item-1", transactionId: "txn-1", name: "Rice", qty: 1, unitPrice: 12, totalPrice: 12, category: "Food" } }],
      carInfo: [{ rowNumber: 2, data: { id: "car-1", currentMileage: 1000, updatedAt: "" } }],
    });

    const data = await new Tracker(sheets).load();

    expect(data.transactions.map((item) => item.id)).toEqual(["txn-2", "txn-1"]);
    expect(data.transactions[1].items).toEqual([expect.objectContaining({ name: "Rice", category: "Food" })]);
    expect(data.dashboard.netAmount).toBe(88);
  });

  it("writes a transaction and receipt items with generated linkage", async () => {
    const sheets = createSheets();
    const tracker = new Tracker(sheets);
    const { id: _id, createdAt: _createdAt, ...input } = transaction;

    const transactionId = await tracker.addTransaction({ ...input, items: [{ id: "line-1", name: "Rice", qty: 1, unitPrice: 12, totalPrice: 12 }] });

    expect(transactionId).toBeTruthy();
    expect(sheets.append).toHaveBeenCalledWith("transactions", expect.objectContaining({ id: transactionId, tax: 0, serviceCharge: 0 }));
    expect(sheets.appendMany).toHaveBeenCalledWith("receiptItems", [expect.objectContaining({ id: "line-1", transactionId })]);
  });

  it("deletes dependent receipt items before deleting a transaction", async () => {
    const sheets = createSheets({
      transactions: [{ rowNumber: 4, data: transaction }],
      receiptItems: [{ rowNumber: 6, data: { id: "item-1", transactionId: "txn-1", name: "Rice", qty: 1, unitPrice: 12, totalPrice: 12, category: "Food" } }],
    });

    await new Tracker(sheets).deleteTransaction("txn-1");

    expect(sheets.deleteMany).toHaveBeenCalledWith("receiptItems", [6]);
    expect(sheets.delete).toHaveBeenCalledWith("transactions", 4);
  });

  it("updates an existing mileage record and appends the first one", async () => {
    const existing = createSheets({ carInfo: [{ rowNumber: 5, data: { id: "car-1", currentMileage: 1000, updatedAt: "" } }] });
    await new Tracker(existing).setMileage(1200);
    expect(existing.update).toHaveBeenCalledWith("carInfo", 5, expect.objectContaining({ id: "car-1", currentMileage: 1200 }));

    const empty = createSheets();
    await new Tracker(empty).setMileage(1200);
    expect(empty.append).toHaveBeenCalledWith("carInfo", expect.objectContaining({ currentMileage: 1200 }));
  });

  it("rejects invalid transactions before they reach the repository", async () => {
    const sheets = createSheets();
    await expect(new Tracker(sheets).addTransaction({ ...transaction, amount: -1 })).rejects.toThrow("non-negative");
    expect(sheets.append).not.toHaveBeenCalled();
  });
});
