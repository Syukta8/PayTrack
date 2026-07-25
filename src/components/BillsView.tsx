import React, { useState } from "react";
import type { BillStatus, Recurrence } from "../model/types";

interface BillsViewProps {
  bills: BillStatus[];
  onMarkPaid: (billId: string) => Promise<void>;
  onAddBill: (bill: {
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
  onMarkPaid,
  onAddBill,
  onDeleteBill,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Bills & Utilities");
  const [amountStr, setAmountStr] = useState("");
  const [dueDayStr, setDueDayStr] = useState("1");
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSaveBill = async () => {
    if (!name.trim()) return;
    const amount = parseFloat(amountStr) || 0;
    const dueDay = parseInt(dueDayStr, 10) || 1;

    await onAddBill({
      name: name.trim(),
      category: category.trim(),
      amount,
      dueDay,
      recurrence,
    });

    setName("");
    setAmountStr("");
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

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Recurring Bills</h2>
        <button
          className="primary-dark-btn"
          style={{ width: "auto", padding: "8px 14px", fontSize: "0.8rem" }}
          onClick={() => setIsAddOpen(true)}
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

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>RM{item.bill.amount.toFixed(2)}</div>
                  {!isPaid ? (
                    <button
                      className="pill-btn active"
                      disabled={busyId === item.bill.id}
                      onClick={() => handlePay(item.bill.id)}
                      style={{ fontSize: "0.7rem", padding: "4px 10px", marginTop: 4 }}
                    >
                      {busyId === item.bill.id ? "Saving…" : "Mark Paid"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onDeleteBill(item.bill.id)}
                      style={{ fontSize: "0.68rem", color: "var(--text-light)", marginTop: 4 }}
                    >
                      Remove
                    </button>
                  )}
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

      {/* Add Bill Drawer Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <button className="sheet-action-btn save" onClick={handleSaveBill}>
                Save
              </button>
              <h3>Add Recurring Bill</h3>
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

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>CATEGORY</div>
              <input
                type="text"
                placeholder="Bills & Utilities"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>AMOUNT (RM)</div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>DUE DAY OF MONTH</div>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDayStr}
                onChange={(e) => setDueDayStr(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>RECURRENCE</div>
              <div className="pill-options-row" style={{ marginBottom: 0 }}>
                {(["monthly", "weekly", "yearly"] as Recurrence[]).map((r) => (
                  <button
                    key={r}
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
