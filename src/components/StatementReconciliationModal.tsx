import React, { useRef, useState } from "react";

interface StatementReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportReconciledItems: (items: Array<{
    date: string;
    amount: number;
    category: string;
    description: string;
    paymentMethod: string;
  }>) => void;
}

export const StatementReconciliationModal: React.FC<StatementReconciliationModalProps> = ({
  isOpen,
  onClose,
  onImportReconciledItems,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    paymentMethod: string;
    selected: boolean;
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setFileName(null);
    setParsedItems([]);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    // Simulate PDF / CSV statement parsing into clean reconciliation items
    setTimeout(() => {
      const mockExtracted = [
        { id: "stmt-1", date: "2026-05-02", amount: 45.90, category: "Food & Dining", description: "ZUS COFFEE SEREMBAN", paymentMethod: "Debit Card", selected: true },
        { id: "stmt-2", date: "2026-05-14", amount: 120.00, category: "Transport", description: "SHELL HIGHWAY KESANG", paymentMethod: "Credit Card", selected: true },
        { id: "stmt-3", date: "2026-05-20", amount: 89.00, category: "Bills & Utilities", description: "UNIFI FIBER MONTHLY", paymentMethod: "Online banking", selected: true },
      ];
      setParsedItems(mockExtracted);
      setIsProcessing(false);
    }, 1200);
  };

  const toggleSelect = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleImport = () => {
    const selected = parsedItems.filter((i) => i.selected);
    onImportReconciledItems(selected);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "1.2rem",
              }}
            >
              📊
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Bank Statement Reconciliation</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Compare & Reconcile Missing Expenses</span>
            </div>
          </div>
          <button className="sheet-action-btn cancel" onClick={handleClose}>
            Cancel
          </button>
        </div>

        <div className="form-field-card" style={{ padding: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {!fileName ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "28px 16px",
                border: "2px dashed var(--border-light)",
                borderRadius: 14,
                backgroundColor: "var(--bg-subtle)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "1.8rem" }}>📄</div>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main)" }}>
                Upload Monthly Bank Statement
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Supports Maybank, CIMB, Bank Islam (PDF or CSV)
              </span>
            </button>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>📄 {fileName}</span>
                <button
                  className="pill-btn"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: "0.7rem", padding: "4px 10px" }}
                >
                  Change File
                </button>
              </div>

              {isProcessing ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  ⏳ Extracting & matching statement lines...
                </div>
              ) : (
                <div>
                  <div className="hero-eyebrow" style={{ marginBottom: 8 }}>
                    UNRECONCILED TRANSACTIONS ({parsedItems.filter((i) => i.selected).length})
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {parsedItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 10,
                          backgroundColor: item.selected ? "rgba(99, 102, 241, 0.08)" : "var(--bg-subtle)",
                          border: item.selected ? "1px solid #6366f1" : "1px solid transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input type="checkbox" checked={item.selected} onChange={() => {}} />
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{item.description}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              {item.date} · {item.category}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#ef4444" }}>
                          RM{item.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="primary-dark-btn"
                    onClick={handleImport}
                    style={{ width: "100%", marginTop: 14, padding: "12px", fontSize: "0.9rem", fontWeight: 800 }}
                  >
                    ⚡ Import Reconciled Transactions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
