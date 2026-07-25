import React, { useState } from "react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: "expense" | "income";
    amount: number;
    category: string;
    paymentMethod: string;
    date: string;
    note: string;
  }) => void;
}

const EXPENSE_CATEGORIES = [
  { id: "Food & Dining", label: "Food & Dining", icon: "🍽️" },
  { id: "Transport", label: "Transport", icon: "🚗" },
  { id: "Shopping", label: "Shopping", icon: "🛍️" },
  { id: "Bills & Utilities", label: "Bills & Utilities", icon: "⚡" },
  { id: "Entertainment", label: "Entertainment", icon: "🎬" },
  { id: "Health", label: "Health", icon: "🏥" },
];

const INCOME_CATEGORIES = [
  { id: "Salary", label: "Salary", icon: "💼" },
  { id: "Savings", label: "Savings", icon: "🏦" },
  { id: "Tabung Haji", label: "Tabung Haji", icon: "🕌" },
  { id: "ASB", label: "ASB", icon: "📈" },
  { id: "Unit Trust", label: "Unit Trust", icon: "📊" },
];

const PAYMENT_METHODS = ["Cash", "QR", "Card", "Transfer"];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0.00");
  const [selectedCategory, setSelectedCategory] = useState("Food & Dining");
  const [selectedPayment, setSelectedPayment] = useState("Cash");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const activeCategories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType: "expense" | "income") => {
    setType(newType);
    setSelectedCategory(newType === "expense" ? "Food & Dining" : "Salary");
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const amount = parseFloat(amountStr) || 0;
    onSubmit({
      type,
      amount,
      category: selectedCategory,
      paymentMethod: selectedPayment,
      date,
      note,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button className="sheet-action-btn save" onClick={handleSave}>
            Save
          </button>
          <h3 style={{ textTransform: "capitalize" }}>Add {type}</h3>
          <button className="sheet-action-btn cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        {/* Expense / Income Pill Toggle */}
        <div className="segmented-pill" style={{ display: "flex", width: "100%", marginBottom: 24, padding: 4 }}>
          <button
            className={`pill-btn ${type === "expense" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px 0", textAlign: "center", color: type === "expense" ? "#ef4444" : undefined }}
            onClick={() => handleTypeChange("expense")}
          >
            Expense
          </button>
          <button
            className={`pill-btn ${type === "income" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px 0", textAlign: "center", color: type === "income" ? "#10b981" : undefined }}
            onClick={() => handleTypeChange("income")}
          >
            Income
          </button>
        </div>

        {/* Currency Input Hero */}
        <div style={{ textAlign: "center", margin: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-light)" }}>RM</span>
            <input
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "var(--text-main)",
                width: "180px",
                outline: "none",
                textAlign: "left"
              }}
            />
          </div>
        </div>

        {/* Category Picker */}
        <div className="hero-eyebrow" style={{ marginBottom: 10 }}>CATEGORY</div>
        <div className="category-scroll-row">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-item ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className="cat-circle">
                <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
              </div>
              <span className="cat-label">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="hero-eyebrow" style={{ marginBottom: 10 }}>PAYMENT</div>
        <div className="pill-options-row">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm}
              className={`opt-pill ${selectedPayment === pm ? "active" : ""}`}
              onClick={() => setSelectedPayment(pm)}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Details Fields Container */}
        <div className="hero-eyebrow" style={{ marginBottom: 10 }}>DETAILS</div>
        <div className="form-field-card">
          <div className="field-input-row">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field-input-row" style={{ borderTop: "1px solid var(--border-light)", paddingTop: 10 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <input
              type="text"
              placeholder="Note (e.g. lunch at mamak)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
