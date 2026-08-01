import { useCallback } from "react";
import type { ExpensePrefillSource } from "../model/expensePrefill";
import { submitTransactionDraft } from "../model/transactionSubmission";
import type { TransactionDraft } from "../model/transactionSubmission";
import type { MaintenanceItem, RecurringBill, Transaction } from "../model/types";
import type { Tracker } from "../model/tracker";

type ReportError = (message: string) => void;
export interface ReconciledStatementItem {
  date: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
}

/** Groups tracker mutations so the application shell consistently reloads and reports errors. */
export function useTrackerCommands(
  tracker: Tracker | null,
  reload: () => Promise<void>,
  reportError: ReportError,
) {
  const run = useCallback(async (operation: (activeTracker: Tracker) => Promise<void>) => {
    if (!tracker) return;
    try {
      await operation(tracker);
      await reload();
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Unable to save your changes.");
    }
  }, [reload, reportError, tracker]);

  const submitTransaction = useCallback((draft: TransactionDraft, scanned: ExpensePrefillSource | null) =>
    run((activeTracker) => submitTransactionDraft(activeTracker, draft, scanned)), [run]);
  const deleteTransaction = useCallback((transactionId: string) => run((activeTracker) => activeTracker.deleteTransaction(transactionId)), [run]);
  const markBillPaid = useCallback((billId: string) => run((activeTracker) => activeTracker.markBillPaid(billId)), [run]);
  const addBill = useCallback((input: Omit<RecurringBill, "id" | "active" | "lastPaidPeriod">) => run((activeTracker) => activeTracker.addBill(input)), [run]);
  const updateBill = useCallback((billId: string, input: Omit<RecurringBill, "id" | "active" | "lastPaidPeriod">) => run((activeTracker) => activeTracker.updateBill(billId, input)), [run]);
  const deleteBill = useCallback((billId: string) => run((activeTracker) => activeTracker.deleteBill(billId)), [run]);
  const updateTransaction = useCallback((transactionId: string, input: Partial<Omit<Transaction, "id" | "createdAt">>) => run((activeTracker) => activeTracker.updateTransaction(transactionId, input)), [run]);
  const setMileage = useCallback((mileage: number) => run((activeTracker) => activeTracker.setMileage(mileage)), [run]);
  const addMaintenance = useCallback((input: Omit<MaintenanceItem, "id" | "active" | "lastServiceMileage">) => run((activeTracker) => activeTracker.addMaintenance(input)), [run]);
  const markMaintenanceDone = useCallback((itemId: string, cost?: number) => run((activeTracker) => activeTracker.markMaintenanceDone(itemId, { cost })), [run]);
  const importReconciledItems = useCallback((items: ReconciledStatementItem[]) => run(async (activeTracker) => {
    for (const item of items) {
      await activeTracker.addTransaction({
        date: item.date,
        type: "expense",
        category: item.category,
        amount: item.amount,
        description: item.description,
        paymentType: item.paymentMethod,
        remarks: "Reconciled from Bank Statement",
      });
    }
  }), [run]);

  return { submitTransaction, deleteTransaction, markBillPaid, addBill, updateBill, deleteBill, updateTransaction, setMileage, addMaintenance, markMaintenanceDone, importReconciledItems };
}
