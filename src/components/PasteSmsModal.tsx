import React, { useState } from "react";

interface PasteSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSmsParsed: (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    paymentMethod: string;
  }) => void;
}

export const PasteSmsModal: React.FC<PasteSmsModalProps> = ({
  isOpen,
  onClose,
  onSmsParsed,
}) => {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseSMS = () => {
    if (!rawText.trim()) {
      setError("Please paste a bank SMS or notification text first.");
      return;
    }

    try {
      // Extract Amount (e.g., RM150.00, MYR 50, 12.50)
      const amountMatch = rawText.match(/(?:RM|MYR)?\s*(\d+(?:\.\d{1,2})?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Detect Payment Method
      let paymentMethod = "Transfer";
      if (/qr/i.test(rawText)) paymentMethod = "QR";
      else if (/credit/i.test(rawText)) paymentMethod = "Credit Card";
      else if (/debit|card/i.test(rawText)) paymentMethod = "Debit Card";
      else if (/spaylater/i.test(rawText)) paymentMethod = "SPayLater";

      // Detect Category
      let category = "Personal";
      if (/food|kopitiam|restaurant|mcd|kfc|starbucks|zus|grabfood|foodpanda/i.test(rawText)) {
        category = "Food & Dining";
      } else if (/petronas|shell|caltex|toll|touch n go|tng/i.test(rawText)) {
        category = "Transport";
      } else if (/unifi|tnb|syabas|air|electricity|utility/i.test(rawText)) {
        category = "Bills & Utilities";
      } else if (/shopee|lazada|mydin|lotus|watson|guardian/i.test(rawText)) {
        category = "Shopping";
      }

      // Merchant/Description extraction
      const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
      const description = lines[0]?.substring(0, 35) || "SMS Captured Expense";

      onSmsParsed({
        amount,
        category,
        description,
        date: new Date().toISOString().split("T")[0],
        paymentMethod,
      });

      setRawText("");
      setError(null);
      onClose();
    } catch {
      setError("Unable to parse text. Please double check the text format.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
          <button className="sheet-action-btn cancel" onClick={onClose}>
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
