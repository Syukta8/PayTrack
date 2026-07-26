import React, { useRef, useState } from "react";
import { createWorker } from "tesseract.js";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    note: string;
    imageUrl?: string;
    driveUrl?: string;
  }) => void;
}

function downscaleImage(dataUrl: string, maxDim = 1280): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function parseReceiptText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let merchantName = lines[0] || "Receipt Scan";
  for (const l of lines.slice(0, 5)) {
    if (l.length > 3 && !/date|receipt|tax|gst|sst|cashier|invoice|tel|welcome/i.test(l)) {
      merchantName = l.substring(0, 32);
      break;
    }
  }

  let totalAmount = 0;
  const amountRegex = /(?:RM|MYR|\$)?\s*(\d{1,4}\.\d{2})/gi;

  for (const line of lines) {
    if (/total|jumlah|net|amount|bayar|cash|debit|credit|spaylater/i.test(line)) {
      const matches = Array.from(line.matchAll(amountRegex));
      if (matches.length > 0) {
        const lastVal = parseFloat(matches[matches.length - 1][1]);
        if (lastVal > 0) {
          totalAmount = lastVal;
          break;
        }
      }
    }
  }

  if (totalAmount === 0) {
    const allMatches = Array.from(text.matchAll(amountRegex))
      .map((m) => parseFloat(m[1]))
      .filter((v) => v > 0 && v < 10000);
    if (allMatches.length > 0) {
      totalAmount = Math.max(...allMatches);
    }
  }

  let category = "Personal";
  const fullUpper = text.toUpperCase();
  if (/FOOD|KOPITIAM|RESTAURANT|MCD|KFC|STARBUCKS|ZUS|GRABFOOD|FOODPANDA|PASAR|AYAM|NASI|LAUK|MEE|DRINK|COFFEE|BAKERY/i.test(fullUpper)) {
    category = "Food & Dining";
  } else if (/PETRONAS|SHELL|CALTEX|TOLL|TOUCH N GO|TNG|PARKING|PETROL|DIESEL/i.test(fullUpper)) {
    category = "Transport";
  } else if (/UNIFI|TNB|SYABAS|AIR|ELECTRICITY|UTILITY|TELEKOM|DIGI|CELCOM|MAXIS/i.test(fullUpper)) {
    category = "Bills & Utilities";
  } else if (/SHOPEE|LAZADA|MYDIN|LOTUS|WATSON|GUARDIAN|MR DIY|DECATHLON|CLOTHES|STORE|SUPERMARKET|MART|DIY/i.test(fullUpper)) {
    category = "Shopping";
  }

  let date = new Date().toISOString().split("T")[0];
  const dateMatch = text.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})|(\d{2}[-\/]\d{2}[-\/]\d{4})/);
  if (dateMatch) {
    const rawDate = dateMatch[0].replace(/\//g, "-");
    const parts = rawDate.split("-");
    if (parts[0].length === 4) {
      date = rawDate;
    } else if (parts[2].length === 4) {
      date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  return {
    merchantName,
    totalAmount,
    date,
    category,
    note: lines.slice(0, 4).join(", ").substring(0, 50),
  };
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onReceiptScanned,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedImage(null);
    setErrorMessage(null);
    setIsScanning(false);
    setStatusText("");
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      setErrorMessage("Please snap a photo or upload a receipt image first.");
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setStatusText("⚡ Optimizing receipt photo for mobile...");

    try {
      // Step 1: Downscale image for fast mobile OCR
      const optimizedImage = await downscaleImage(selectedImage, 1280);

      // Step 2: Initialize Tesseract WebAssembly Worker
      setStatusText("📄 Extracting text with Offline OCR Engine...");
      const worker = await createWorker("eng");

      // Step 3: Run recognition
      setStatusText("✨ Recognizing items & amounts...");
      const { data } = await worker.recognize(optimizedImage);
      await worker.terminate();

      const extractedText = data.text || "";
      if (!extractedText.trim()) {
        throw new Error("Could not detect text on this receipt. Please ensure photo is clear.");
      }

      // Step 4: Parse financial details
      const parsed = parseReceiptText(extractedText);

      const dateStr = parsed.date || new Date().toISOString().split("T")[0];
      const receiptId = `rcpt_${Date.now().toString(36)}`;
      const driveFolder = `PayTrack_Receipts/${dateStr.slice(0, 4)}/${dateStr.slice(5, 7)}/${receiptId}.jpg`;

      onReceiptScanned({
        amount: parsed.totalAmount,
        category: parsed.category,
        description: parsed.merchantName,
        date: dateStr,
        note: parsed.note,
        imageUrl: optimizedImage || selectedImage,
        driveUrl: `Google Drive: ${driveFolder}`,
      });

      handleClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to process receipt with offline OCR.");
    } finally {
      setIsScanning(false);
      setStatusText("");
    }
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
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              📄
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Offline Receipt Scanner</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mobile-Optimized Browser OCR (Zero Key Setup)</span>
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
                  Use mobile camera
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
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid #10b981",
                color: "#065f46",
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
            {isScanning ? "📄 Processing Receipt..." : "⚡ Scan & Extract Expense Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
