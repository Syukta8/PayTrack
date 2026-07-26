import type { CarInfo, MaintenanceItem, ReceiptItemRecord, RecurringBill, ServiceRecord, Transaction } from "./types";

export type CellType = "string" | "number" | "boolean";
export type SheetEntity = "transactions" | "bills" | "maintenance" | "carInfo" | "serviceHistory" | "receiptItems";

export interface SheetDefinition<T extends object> { tab: string; columns: readonly (readonly [keyof T, CellType])[]; }

export const SHEETS: { [K in SheetEntity]: SheetDefinition<SheetRecord<K>> } = {
  // Append new columns only at the end: rows map by position, and initializeTemplate treats
  // a shorter existing header as an older-version prefix to extend.
  transactions: { tab: "Transactions", columns: [["id", "string"], ["date", "string"], ["type", "string"], ["category", "string"], ["amount", "number"], ["description", "string"], ["paymentType", "string"], ["remarks", "string"], ["createdAt", "string"], ["tax", "number"], ["serviceCharge", "number"]] },
  bills: { tab: "RecurringBills", columns: [["id", "string"], ["name", "string"], ["amount", "number"], ["category", "string"], ["dueDay", "number"], ["recurrence", "string"], ["lastPaidPeriod", "string"], ["active", "boolean"]] },
  maintenance: { tab: "MaintenanceItems", columns: [["id", "string"], ["name", "string"], ["notes", "string"], ["intervalMonths", "number"], ["intervalKm", "number"], ["lastServiceDate", "string"], ["lastServiceMileage", "number"], ["active", "boolean"]] },
  carInfo: { tab: "CarInfo", columns: [["id", "string"], ["currentMileage", "number"], ["updatedAt", "string"]] },
  serviceHistory: { tab: "ServiceHistory", columns: [["id", "string"], ["date", "string"], ["mileage", "number"], ["description", "string"], ["createdAt", "string"]] },
  receiptItems: { tab: "ReceiptItems", columns: [["id", "string"], ["transactionId", "string"], ["name", "string"], ["qty", "number"], ["unitPrice", "number"], ["totalPrice", "number"], ["category", "string"]] },
};

export type SheetRecord<K extends SheetEntity> = K extends "transactions" ? Transaction : K extends "bills" ? RecurringBill : K extends "maintenance" ? MaintenanceItem : K extends "carInfo" ? CarInfo : K extends "receiptItems" ? ReceiptItemRecord : ServiceRecord;
