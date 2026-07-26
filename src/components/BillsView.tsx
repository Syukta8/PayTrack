import React, { useState } from "react";
import type { BillStatus, Recurrence, Transaction } from "../model/types";

interface BillsViewProps {
  bills: BillStatus[];
  transactions?: Transaction[];
  onMarkPaid: (billId: string) => Promise<void>;
  onAddBill: (bill: {
    name: string;
    category: string;
    amount: number;
    dueDay: number;
    recurrence: Recurrence;
  }) => Promise<void>;
  onUpdateBill: (billId: string, updated: {
    name: string;
    category: string;
    amount: number;
    dueDay: number;
    recurrence: Recurrence;
  }) => Promise<void>;
  onDeleteBill: (billId: string) => Promise<void>;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  transactions = [],
  onMarkPaid,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const category = "Bills & Utilities";
  const [amountStr, setAmountStr] = useState("");
  const [dueDayStr, setDueDayStr] = useState("1");
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [busyId, setBusyId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingBillId(null);
    setName("");
    setAmountStr("");
    setDueDayStr("1");
    setRecurrence("monthly");
    setIsAddOpen(true);
  };

  const openEditModal = (billStatus: BillStatus) => {
    setEditingBillId(billStatus.bill.id);
    setName(billStatus.bill.name);
    setAmountStr(String(billStatus.bill.amount));
    setDueDayStr(String(billStatus.bill.dueDay));
    setRecurrence(billStatus.bill.recurrence);
    setIsAddOpen(true);
  };

  const handleSaveBill = async () => {
    if (!name.trim()) return;
    const amount = parseFloat(amountStr) || 0;
    const dueDay = parseInt(dueDayStr, 10) || 1;

    if (editingBillId) {
      await onUpdateBill(editingBillId, {
        name: name.trim(),
        category,
        amount,
        dueDay,
        recurrence,
      });
    } else {
      await onAddBill({
        name: name.trim(),
        category,
        amount,
        dueDay,
        recurrence,
      });
    }

    setName("");
    setAmountStr("");
    setEditingBillId(null);
    setIsAddOpen(false);
  };

  const handlePay = async (billId: string) => {
    setBusyId(billId);
    try {
      await onMarkPaid(billId);
    } finally {
      setBusyId(null);
    }
  };

  const bnplItems = transactions.filter(
    (t) =>
      t.paymentType === "SPayLater" ||
      (t.remarks && t.remarks.includes("SPayLater")) ||
      (t.description && t.description.includes("SPayLater"))
  );

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Recurring Bills</h2>
        <button
          className="primary-dark-btn"
          style={{ width: "auto", padding: "8px 14px", fontSize: "0.8rem" }}
          onClick={openAddModal}
        >
          + Add Bill
        </button>
      </div>

      <div className="section-card" style={{ margin: "0 20px 16px" }}>
        {bills.length > 0 ? (
          bills.map((item) => {
            const isPaid = item.status === "paid";
            const isOverdue = item.status === "overdue";

            return (
              <div
                key={item.bill.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>{item.bill.name}</span>
                    <span
                      className="badge-pill"
                      style={{
                        backgroundColor: isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : "#fef3c7",
                        color: isPaid ? "#166534" : isOverdue ? "#ef4444" : "#b45309",
                        textTransform: "capitalize",
                      }}
                    >
                      {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {item.bill.category} · Due Day {item.bill.dueDay} ({item.bill.recurrence})
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>RM{item.bill.amount.toFixed(2)}</div>
                    {!isPaid && (
                      <button
                        className="pill-btn active"
                        disabled={busyId === item.bill.id}
                        onClick={() => handlePay(item.bill.id)}
                        style={{ fontSize: "0.7rem", padding: "4px 10px", marginTop: 4 }}
                      >
                        {busyId === item.bill.id ? "Saving…" : "Mark Paid"}
                      </button>
                    )}
                  </div>
                  <button
                    title="Edit bill"
                    onClick={() => openEditModal(item)}
                    style={{
                      padding: 6,
                      color: "var(--text-light)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    title="Delete recurring bill"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this recurring bill?")) {
                        void onDeleteBill(item.bill.id);
                      }
                    }}
                    style={{
                      padding: 6,
                      color: "var(--text-light)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
            No recurring bills added yet.
          </div>
        )}
      </div>

      {/* SPayLater / BNPL Installments Table */}
      <div style={{ margin: "24px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>SPayLater & Installments</h3>
          <span className="badge-pill" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
            BNPL Ledger
          </span>
        </div>

        <div className="section-card">
          {bnplItems.length > 0 ? (
            bnplItems.map((item) => {
              const match = (item.description + " " + item.remarks).match(/SPayLater\s*(\d+)M/i);
              const tenureMonths = match ? parseInt(match[1], 10) : 1;
              const monthlyInstallment = (item.amount / tenureMonths).toFixed(2);

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)" }}>
                      {item.description || "SPayLater Purchase"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {item.date} · {tenureMonths} Months Tenure ({item.category})
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ef4444" }}>
                      RM{monthlyInstallment}<span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Total: RM{item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No active SPayLater installment plans recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Bill Drawer Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <button className="sheet-action-btn save" onClick={handleSaveBill}>
                Save
              </button>
              <h3>{editingBillId ? "Edit Recurring Bill" : "Add Recurring Bill"}</h3>
              <button className="sheet-action-btn cancel" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
            </div>

            <div className="form-field-card">
              <div className="hero-eyebrow">BILL NAME</div>
              <input
                type="text"
                placeholder="e.g. Unifi Fiber, Electric Bill"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 14 }}>AMOUNT (RM)</div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 14 }}>DUE DAY OF MONTH</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, margin: "8px 0 14px", padding: 8, background: "var(--bg-subtle)", borderRadius: 12 }}>
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const isSelected = parseInt(dueDayStr, 10) === dayNum;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setDueDayStr(String(dayNum))}
                      style={{
                        padding: "6px 0",
                        fontSize: "0.78rem",
                        fontWeight: isSelected ? 800 : 500,
                        borderRadius: 8,
                        backgroundColor: isSelected ? "#0f172a" : "transparent",
                        color: isSelected ? "#ffffff" : "var(--text-main)",
                        border: isSelected ? "none" : "1px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>RECURRENCE</div>
              <div className="pill-options-row" style={{ marginBottom: 0 }}>
                {(["monthly", "weekly", "yearly"] as Recurrence[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`opt-pill ${recurrence === r ? "active" : ""}`}
                    onClick={() => setRecurrence(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
