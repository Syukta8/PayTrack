import React, { useRef, useState } from "react";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    note: string;
  }) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onReceiptScanned,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("paytrack.geminiApiKey") || "");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    if (!apiKey.trim()) {
      setErrorMessage("Please enter your free Gemini API Key below.");
      return;
    }

    localStorage.setItem("paytrack.geminiApiKey", apiKey.trim());
    setIsScanning(true);
    setErrorMessage(null);

    try {
      // Strip base64 prefix
      const base64Data = selectedImage.split(",")[1];
      const mimeType = selectedImage.split(";")[0].split(":")[1] || "image/jpeg";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this receipt image and extract structured financial information.
Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "merchantName": "Store Name",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "Food & Dining" | "Shopping" | "Entertainment" | "Bills & Utilities" | "Personal" | "Transport",
  "note": "brief summary of items"
}`,
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API request failed (${response.status}). Check your API Key.`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsed = JSON.parse(cleanedJson);

      onReceiptScanned({
        amount: Number(parsed.totalAmount) || 0,
        category: parsed.category || "Food & Dining",
        description: parsed.merchantName || "Receipt Scan",
        date: parsed.date || new Date().toISOString().split("T")[0],
        note: parsed.note || "",
      });

      setSelectedImage(null);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to scan receipt.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <h3>AI Receipt Scanner</h3>
          <button className="sheet-action-btn cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-field-card" style={{ textAlign: "center" }}>
          {/* File input (Camera capture on mobile & File upload on Desktop) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {selectedImage ? (
            <div style={{ marginBottom: 16 }}>
              <img
                src={selectedImage}
                alt="Receipt preview"
                style={{ maxHeight: 220, borderRadius: 12, border: "1px solid var(--border-light)", objectFit: "contain" }}
              />
              <div style={{ marginTop: 8 }}>
                <button
                  className="pill-btn"
                  style={{ fontSize: "0.75rem", padding: "4px 12px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Retake / Choose Other
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "36px 16px",
                border: "2px dashed var(--border-light)",
                borderRadius: 16,
                backgroundColor: "var(--bg-subtle)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: "2rem" }}>📷</div>
              <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>Snap Photo or Upload Receipt</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supports JPG, PNG, WEBP receipts</span>
            </button>
          )}

          {/* Gemini API Key Entry */}
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="hero-eyebrow">GEMINI API KEY (FREE AI VISION)</div>
            <input
              type="password"
              placeholder="Paste your Gemini API key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: 4 }}>
              Get a free API key at <strong>aistudio.google.com</strong>
            </div>
          </div>

          {errorMessage && (
            <div style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: 14 }}>
              {errorMessage}
            </div>
          )}

          <button
            className="primary-dark-btn"
            disabled={isScanning || !selectedImage}
            onClick={handleProcessOCR}
          >
            {isScanning ? "Scanning with Gemini AI..." : "Scan & Extract Receipt Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
