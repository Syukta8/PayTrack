import React, { useState, useEffect, useMemo } from "react";
import { describeDuplicate, findDuplicates } from "../model/duplicateGuard";
import { PAYMENT_TYPES, normalizePaymentType } from "../model/types";
import type { ReceiptItem, Transaction } from "../model/types";

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
    imageUrl?: string;
    tax?: number;
    serviceCharge?: number;
    items?: ReceiptItem[];
  }) => void;
  initialData?: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    note?: string;
    imageUrl?: string;
    paymentMethod?: string;
    tax?: number;
    serviceCharge?: number;
    items?: ReceiptItem[];
  } | null;
  /** Already-recorded transactions, used only to warn about a probable duplicate scan. */
  existingTransactions?: Transaction[];
}

const EXPENSE_CATEGORIES = [
  { id: "Food & Dining", label: "Food & Dining", icon: "🍽️" },
  { id: "Personal", label: "Personal", icon: "👤" },
  { id: "Transport", label: "Transport", icon: "🚗" },
  { id: "Shopping", label: "Shopping", icon: "🛍️" },
  { id: "Bills & Utilities", label: "Bills & Utilities", icon: "⚡" },
  { id: "Entertainment", label: "Entertainment", icon: "🎬" },
  { id: "Health", label: "Health", icon: "🏥" },
  { id: "Savings", label: "Savings", icon: "🏦" },
  { id: "Tabung Haji", label: "Tabung Haji", icon: "🕌" },
  { id: "ASB", label: "ASB", icon: "📈" },
  { id: "Unit Trust", label: "Unit Trust", icon: "📊" },
];

const INCOME_CATEGORIES = [
  { id: "Salary", label: "Salary", icon: "💼" },
];

const PAYMENT_METHODS = PAYMENT_TYPES;

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingTransactions,
}) => {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0.00");
  const [selectedCategory, setSelectedCategory] = useState("Food & Dining");
  const [selectedPayment, setSelectedPayment] = useState("Cash");
  const [spayTenure, setSpayTenure] = useState<1 | 3 | 6 | 12>(1);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<ReceiptItem[] | undefined>(undefined);
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);

  useEffect(() => {
    if (initialData) {
      setType("expense");
      if (initialData.amount) setAmountStr(String(initialData.amount));
      if (initialData.category) setSelectedCategory(initialData.category);
      if (initialData.date) setDate(initialData.date);
      if (initialData.description || initialData.note) {
        setNote(initialData.description || initialData.note || "");
      }
      // A detected method must survive prefill: SPayLater drives the tenure fee, so losing
      // it silently changes the amount that gets recorded.
      const detectedPayment = normalizePaymentType(initialData.paymentMethod);
      if (detectedPayment) setSelectedPayment(detectedPayment);
      setImageUrl(initialData.imageUrl);
      setItems(initialData.items);
      setTax(initialData.tax ?? 0);
      setServiceCharge(initialData.serviceCharge ?? 0);
    } else {
      setImageUrl(undefined);
      setItems(undefined);
      setTax(0);
      setServiceCharge(0);
    }
  }, [initialData]);

  const activeCategories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const rawAmount = parseFloat(amountStr) || 0;
  const spayFeeRate = selectedPayment === "SPayLater" && spayTenure > 1 ? 0.015 * spayTenure : 0;
  const effectiveAmount = selectedPayment === "SPayLater" ? rawAmount * (1 + spayFeeRate) : rawAmount;

  /** Compared against the amount that would actually be written, so an SPayLater entry is
   * matched on its fee-inclusive total rather than the pre-fee figure. */
  const duplicateWarning = useMemo(() => {
    if (!existingTransactions?.length || effectiveAmount <= 0) return null;
    const candidate = { date, amount: effectiveAmount, description: note, type };
    return describeDuplicate(findDuplicates(existingTransactions, candidate), candidate);
  }, [existingTransactions, effectiveAmount, date, note, type]);

  const handleTypeChange = (newType: "expense" | "income") => {
    setType(newType);
    setSelectedCategory(newType === "expense" ? "Food & Dining" : "Salary");
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const finalNote = note;

    onSubmit({
      type,
      amount: effectiveAmount,
      category: selectedCategory,
      paymentMethod: selectedPayment,
      date,
      note: finalNote,
      imageUrl,
      tax,
      serviceCharge,
      items,
    });
    // Reset state values after saving
    setAmountStr("0.00");
    setSelectedCategory(type === "expense" ? "Food & Dining" : "Salary");
    setSelectedPayment("Cash");
    setSpayTenure(1);
    setNote("");
    setImageUrl(undefined);
    setItems(undefined);
    setTax(0);
    setServiceCharge(0);
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

        {/* Advisory only: a genuine repeat purchase is still saveable. */}
        {duplicateWarning && (
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.10)",
              border: "1px solid #fbbf24",
              color: "#92400e",
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: "0.78rem",
              marginBottom: 16,
              textAlign: "left",
              lineHeight: 1.5,
            }}
          >
            ⚠️ {duplicateWarning}
          </div>
        )}

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
        <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-light)" }}>RM</span>
            <input
              type="number"
              step="0.01"
              className="huge-amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
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

        {/* Subitem Verification & Mismatch Card */}
        {(() => {
          if (!items || items.length === 0) return null;
          const itemsSum = items.reduce((sum, item) => sum + item.totalPrice, 0);
          const currentAmount = parseFloat(amountStr) || 0;
          const feeRate = selectedPayment === "SPayLater" && spayTenure > 1 ? 0.015 * spayTenure : 0;
          const expectedTotal = itemsSum * (1 + feeRate);
          const hasMismatch = Math.abs(expectedTotal - currentAmount) > 0.10 && Math.abs(itemsSum - currentAmount) > 0.10;

          if (hasMismatch) {
            return (
              <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fdba74", padding: "10px 14px", borderRadius: 14, marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#c2410c", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️ Subitem Sum Mismatch Detected</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#9a3412", marginBottom: 8 }}>
                  Receipt items sum (RM{itemsSum.toFixed(2)}) differs from entered amount (RM{currentAmount.toFixed(2)}).
                </div>
                <button
                  type="button"
                  onClick={() => setAmountStr(itemsSum.toFixed(2))}
                  style={{
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  ✨ Sync Base Amount to Receipt Items (RM{itemsSum.toFixed(2)})
                </button>
              </div>
            );
          }

          return (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", padding: "8px 12px", borderRadius: 12, marginBottom: 20, textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>
              ✅ Subitems Verified — {items.length} items (RM{itemsSum.toFixed(2)}) {feeRate > 0 ? `+ SPayLater ${spayTenure}M (+${(feeRate * 100).toFixed(1)}%)` : ""} match total!
            </div>
          );
        })()}

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

        {selectedPayment === "SPayLater" && (
          <div style={{ marginTop: 12, padding: "12px", background: "var(--bg-subtle)", borderRadius: 12 }}>
            <div className="hero-eyebrow" style={{ marginBottom: 8 }}>SPAYLATER TENURE</div>
            <div className="pill-options-row" style={{ marginBottom: 0 }}>
              {([1, 3, 6, 12] as const).map((months) => {
                const principal = parseFloat(amountStr) || 0;
                const feeRate = months > 1 ? 0.015 * months : 0;
                const totalWithFee = principal * (1 + feeRate);
                const monthlyAmt = principal > 0 ? (totalWithFee / months).toFixed(2) : "0.00";
                return (
                  <button
                    key={months}
                    type="button"
                    className={`opt-pill ${spayTenure === months ? "active" : ""}`}
                    onClick={() => setSpayTenure(months)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 12px" }}
                  >
                    <span>{months} {months === 1 ? "Month" : "Months"}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>RM{monthlyAmt}/mo</span>
                    <span style={{ fontSize: "0.6rem", opacity: 0.75 }}>
                      {months === 1 ? "0% Fee" : `+${(feeRate * 100).toFixed(1)}% Fee`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
