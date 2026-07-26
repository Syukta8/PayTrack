import type { CarInfo, MaintenanceItem, RecurringBill, ServiceRecord, Transaction } from "./types";

export type CellType = "string" | "number" | "boolean";
export type SheetEntity = "transactions" | "bills" | "maintenance" | "carInfo" | "serviceHistory";

export interface SheetDefinition<T extends object> { tab: string; columns: readonly (readonly [keyof T, CellType])[]; }

export const SHEETS: { [K in SheetEntity]: SheetDefinition<SheetRecord<K>> } = {
  transactions: { tab: "Transactions", columns: [["id", "string"], ["date", "string"], ["type", "string"], ["category", "string"], ["amount", "number"], ["description", "string"], ["paymentType", "string"], ["remarks", "string"], ["createdAt", "string"], ["imageUrl", "string"], ["driveUrl", "string"]] },
  bills: { tab: "RecurringBills", columns: [["id", "string"], ["name", "string"], ["amount", "number"], ["category", "string"], ["dueDay", "number"], ["recurrence", "string"], ["lastPaidPeriod", "string"], ["active", "boolean"]] },
  maintenance: { tab: "MaintenanceItems", columns: [["id", "string"], ["name", "string"], ["notes", "string"], ["intervalMonths", "number"], ["intervalKm", "number"], ["lastServiceDate", "string"], ["lastServiceMileage", "number"], ["active", "boolean"]] },
  carInfo: { tab: "CarInfo", columns: [["id", "string"], ["currentMileage", "number"], ["updatedAt", "string"]] },
  serviceHistory: { tab: "ServiceHistory", columns: [["id", "string"], ["date", "string"], ["mileage", "number"], ["description", "string"], ["createdAt", "string"]] },
};

export type SheetRecord<K extends SheetEntity> = K extends "transactions" ? Transaction : K extends "bills" ? RecurringBill : K extends "maintenance" ? MaintenanceItem : K extends "carInfo" ? CarInfo : ServiceRecord;
