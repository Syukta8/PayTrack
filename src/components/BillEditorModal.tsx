import React from "react";
import { PAYMENT_TYPES } from "../model/types";
import type { Recurrence } from "../model/types";

/** Editor state and callbacks needed to render the recurring-bill drawer. */
export interface BillEditorModalProps {
  isOpen: boolean;
  isEditing: boolean;
  name: string;
  amount: string;
  dueDay: string;
  recurrence: Recurrence;
  paymentType: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDueDayChange: (value: string) => void;
  onRecurrenceChange: (value: Recurrence) => void;
  onPaymentTypeChange: (value: string) => void;
}

/** Keeps the recurring-bill form separate from list and ledger rendering. */
export const BillEditorModal: React.FC<BillEditorModalProps> = ({
  isOpen, isEditing, name, amount, dueDay, recurrence, paymentType, onClose, onSave,
  onNameChange, onAmountChange, onDueDayChange, onRecurrenceChange, onPaymentTypeChange,
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button className="sheet-action-btn save" onClick={onSave}>Save</button>
          <h3>{isEditing ? "Edit Recurring Bill" : "Add Recurring Bill"}</h3>
          <button className="sheet-action-btn cancel" onClick={onClose}>Cancel</button>
        </div>
        <div className="form-field-card">
          <div className="hero-eyebrow">BILL NAME</div>
          <input type="text" placeholder="e.g. Unifi Fiber, Electric Bill" value={name} onChange={(event) => onNameChange(event.target.value)} />
          <div className="hero-eyebrow" style={{ marginTop: 14 }}>AMOUNT (RM)</div>
          <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(event) => onAmountChange(event.target.value)} />
          <div className="hero-eyebrow" style={{ marginTop: 14 }}>DUE DAY OF MONTH</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, margin: "8px 0 14px", padding: 8, background: "var(--bg-subtle)", borderRadius: 12 }}>
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <button key={day} type="button" onClick={() => onDueDayChange(String(day))} style={{ padding: "6px 0", fontSize: "0.78rem", fontWeight: Number.parseInt(dueDay, 10) === day ? 800 : 500, borderRadius: 8, backgroundColor: Number.parseInt(dueDay, 10) === day ? "#0f172a" : "transparent", color: Number.parseInt(dueDay, 10) === day ? "#ffffff" : "var(--text-main)", border: "1px solid transparent" }}>{day}</button>
            ))}
          </div>
          <div className="hero-eyebrow" style={{ marginTop: 14 }}>RECURRENCE</div>
          <div className="pill-options-row" style={{ marginBottom: 14 }}>
            {(["monthly", "weekly", "yearly"] as Recurrence[]).map((value) => <button key={value} type="button" className={`opt-pill ${recurrence === value ? "active" : ""}`} onClick={() => onRecurrenceChange(value)}>{value}</button>)}
          </div>
          <div className="hero-eyebrow" style={{ marginTop: 8 }}>DEFAULT PAYMENT METHOD</div>
          <div className="pill-options-row" style={{ marginBottom: 0 }}>
            {PAYMENT_TYPES.map((value) => <button key={value} type="button" className={`opt-pill ${paymentType === value ? "active" : ""}`} onClick={() => onPaymentTypeChange(value)}>{value}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
};
