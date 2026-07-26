export type TransactionType = "income" | "expense";
export type Recurrence = "monthly" | "weekly" | "yearly";
export type BillHealth = "paid" | "overdue" | "due_soon" | "upcoming";
export type MaintenanceHealth = Exclude<BillHealth, "paid">;

export const PAYMENT_TYPES = ["Online banking", "QR code", "Debit card", "Credit card", "SPayLater", "Cash"] as const;

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  paymentType: string;
  remarks: string;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  recurrence: Recurrence;
  lastPaidPeriod: string;
  active: boolean;
}

export interface Budget { id: string; category: string; monthlyLimit: number; }
export interface Category { id: string; name: string; type: TransactionType; }
export interface CarInfo { id: string; currentMileage: number; updatedAt: string; }
export interface ServiceRecord { id: string; date: string; mileage: number; description: string; createdAt: string; }

export interface MaintenanceItem {
  id: string;
  name: string;
  notes: string;
  intervalMonths: number;
  intervalKm: number;
  lastServiceDate: string;
  lastServiceMileage: number;
  active: boolean;
}

export interface BillStatus { bill: RecurringBill; dueDate: string; daysUntilDue: number; isPaidForCurrentPeriod: boolean; status: BillHealth; }
export interface MaintenanceStatus { item: MaintenanceItem; nextDueDate: string | null; daysUntilDue: number | null; nextDueMileage: number | null; kmUntilDue: number | null; status: MaintenanceHealth; }
export interface CalendarEvent { id: string; date: string; kind: "bill" | "maintenance"; title: string; status: BillHealth; sourceId: string; }

export interface DashboardSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  spendByCategory: { category: string; amount: number }[];
  bills: BillStatus[];
}
