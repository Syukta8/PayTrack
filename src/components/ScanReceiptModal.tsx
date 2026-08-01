import React, { useRef } from "react";
import { useReceiptScannerViewModel } from "../viewModels/useReceiptScannerViewModel";
import type { ScannedTransactionDraft } from "../viewModels/useReceiptScannerViewModel";
import { ReceiptImageSourceChooser } from "./ReceiptImageSourceChooser";
import { ScannerFeedback } from "./ScannerFeedback";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: ScannedTransactionDraft) => void;
}

/** Hosts the receipt scanner workflow and delegates presentational sections to focused views. */
export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onReceiptScanned,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const {
    selectedImage,
    isScanning,
    statusText,
    errorMessage,
    warningMessage,
    selectImage,
    scan,
    reset,
  } = useReceiptScannerViewModel(onReceiptScanned);

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectImage(file);
  };

  const handleProcessOCR = () => {
    void scan();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="sheet-drag-handle" />

        {/* Header */}
        <div className="sheet-header" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
            >
              ✨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>AI Receipt Scanner</h3>
            </div>
          </div>
          <button className="sheet-action-btn cancel" onClick={handleClose}>
            Cancel
          </button>
        </div>

        {/* Upload Container */}
        <div className="form-field-card" style={{ padding: 18 }}>
          {/* Camera input (forces camera on mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Gallery file upload input (opens file picker on phone/desktop) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <ReceiptImageSourceChooser
            selectedImage={selectedImage}
            onChooseCamera={() => cameraInputRef.current?.click()}
            onChooseGallery={() => galleryInputRef.current?.click()}
          />

          <ScannerFeedback
            isScanning={isScanning}
            statusText={statusText}
            warningMessage={warningMessage}
            errorMessage={errorMessage}
          />

          <button
            className="primary-dark-btn"
            disabled={isScanning || !selectedImage}
            onClick={handleProcessOCR}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "0.9rem",
              fontWeight: 800,
              opacity: isScanning || !selectedImage ? 0.6 : 1,
            }}
          >
            {isScanning ? "🤖 AI Scanner Processing..." : "✨ Scan & Extract Receipt"}
          </button>

          {/* Extraction is a best-effort reading, not a guarantee. Say so where the user is
              about to accept the numbers. */}
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Extracted values are a best-effort reading and can be wrong — check the amount and
            date on the next screen before saving.
          </p>
        </div>
      </div>
    </div>
  );
};
