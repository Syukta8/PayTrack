import React, { useRef } from "react";
import { useReceiptScannerViewModel } from "../viewModels/useReceiptScannerViewModel";
import type { ScannedTransactionDraft } from "../viewModels/useReceiptScannerViewModel";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: ScannedTransactionDraft) => void;
}

/** View for the receipt scanner: markup and UI intent only. All extraction, validation and
 * status logic lives in useReceiptScannerViewModel. */
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

          {selectedImage ? (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={selectedImage}
                  alt="Receipt preview"
                  style={{
                    maxHeight: 200,
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8 }}>
                <button
                  className="pill-btn"
                  style={{ fontSize: "0.76rem", padding: "6px 12px", fontWeight: 600 }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  📷 Retake Photo
                </button>
                <button
                  className="pill-btn"
                  style={{ fontSize: "0.76rem", padding: "6px 12px", fontWeight: 600 }}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  🖼️ Upload Other File
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  padding: "24px 12px",
                  border: "2px dashed var(--border-light)",
                  borderRadius: 16,
                  backgroundColor: "var(--bg-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  📷
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Snap Photo
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Use camera
                </span>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  padding: "24px 12px",
                  border: "2px dashed var(--border-light)",
                  borderRadius: 16,
                  backgroundColor: "var(--bg-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  🖼️
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Upload Image
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Choose from gallery
                </span>
              </button>
            </div>
          )}

          {isScanning && (
            <div
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.08)",
                border: "1px solid #3b82f6",
                color: "#1e40af",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: "0.8rem",
                fontWeight: 700,
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              {statusText}
            </div>
          )}

          {warningMessage && !errorMessage && (
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.10)",
                border: "1px solid #fbbf24",
                color: "#92400e",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: "0.78rem",
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              ⚠️ {warningMessage}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: "0.78rem",
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
};
