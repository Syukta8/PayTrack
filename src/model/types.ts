export type TransactionType = "income" | "expense";
export type Recurrence = "monthly" | "weekly" | "yearly";
export type BillHealth = "paid" | "overdue" | "due_soon" | "upcoming";
export type MaintenanceHealth = Exclude<BillHealth, "paid">;

/** The single source of truth for payment labels: the picker, the SMS parser, the receipt
 * scanner prompt, and the value written to the sheet all read from this list. */
export const PAYMENT_TYPES = ["Online banking", "QR code", "Debit card", "Credit card", "SPayLater", "Cash"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

/** Older builds wrote their own variants ("QR", "Transfer", "Debit Card"), and the vision
 * model may echo a near-miss, so incoming labels are folded onto the canonical list. */
const PAYMENT_ALIASES: Record<string, PaymentType> = {
  "qr": "QR code",
  "qr pay": "QR code",
  "duitnow": "QR code",
  "duitnow qr": "QR code",
  "transfer": "Online banking",
  "bank transfer": "Online banking",
  "online transfer": "Online banking",
  "onlinebanking": "Online banking",
  "debitcard": "Debit card",
  "creditcard": "Credit card",
  "spay later": "SPayLater",
  "shopeepay later": "SPayLater",
};

export function normalizePaymentType(value: string | undefined | null): PaymentType | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  const exact = PAYMENT_TYPES.find((type) => type.toLowerCase() === key);
  if (exact) return exact;
  return PAYMENT_ALIASES[key] ?? null;
}

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

/** A ReceiptItem as stored in its own sheet tab, linked to its parent transaction.
 * The sheet is the authority for line items; IndexedDB only caches receipt images. */
export interface ReceiptItemRecord {
  id: string;
  transactionId: string;
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

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
  imageUrl?: string;
  tax?: number;
  serviceCharge?: number;
  items?: ReceiptItem[];
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
  paymentType?: string;
}

export interface Budget { id: string; category: string; monthlyLimit: number; }
export interface Category { id: string; name: string; type: TransactionType; }
export interface CarInfo { id: string; currentMileage: number; updatedAt: string; }
/** Account-level preferences shared across the user's connected devices. */
export interface AppSettings { id: string; trackingCycleStartDay: number; }
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
