import React, { useState } from "react";
import { parseSmsExpense } from "../model/smsParser";
import type { ParsedSmsExpense } from "../model/smsParser";

interface PasteSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSmsParsed: (data: ParsedSmsExpense) => void;
}

export const PasteSmsModal: React.FC<PasteSmsModalProps> = ({
  isOpen,
  onClose,
  onSmsParsed,
}) => {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setRawText("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleParseSMS = () => {
    if (!rawText.trim()) {
      setError("Please paste a bank SMS or notification text first.");
      return;
    }

    onSmsParsed(parseSmsExpense(rawText));
    setRawText("");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "1.2rem",
              }}
            >
              📲
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Paste Bank SMS / Notification</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Auto-captures Amount, Merchant & Method</span>
            </div>
          </div>
          <button className="sheet-action-btn cancel" onClick={handleClose}>
            Cancel
          </button>
        </div>

        <div className="form-field-card" style={{ padding: 16 }}>
          <textarea
            rows={5}
            placeholder="Paste raw bank SMS here (e.g., 'RM150.00 spent at PETRONAS KESANG via Maybank Debit Card on 26/07/2026')..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--border-light)",
              fontSize: "0.85rem",
              resize: "none",
              fontFamily: "inherit",
            }}
          />

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="primary-dark-btn"
            onClick={handleParseSMS}
            style={{ width: "100%", marginTop: 14, padding: "12px", fontSize: "0.9rem", fontWeight: 800 }}
          >
            ⚡ Parse & Autofill Expense
          </button>
        </div>
      </div>
    </div>
  );
};
