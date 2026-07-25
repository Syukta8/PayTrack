import React from "react";

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTransaction: () => void;
  onOpenScanReceipt: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onOpenAddTransaction,
  onOpenScanReceipt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header" style={{ marginBottom: 12 }}>
          <h3>Quick Actions</h3>
        </div>

        <div className="quick-actions-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <button
            className="action-tile"
            onClick={() => {
              onClose();
              onOpenAddTransaction();
            }}
          >
            <div className="tile-icon-box">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="tile-title">Add Transaction</span>
            <span className="tile-sub">Log income or expense</span>
          </button>

          <button
            className="action-tile"
            onClick={() => {
              onClose();
              onOpenScanReceipt();
            }}
          >
            <div className="tile-icon-box">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="tile-title">Scan Receipt</span>
            <span className="tile-sub">AI-powered OCR capture</span>
          </button>
        </div>
      </div>
    </div>
  );
};
