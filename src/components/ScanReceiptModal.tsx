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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
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
      const base64Data = selectedImage.split(",")[1];
      const mimeType = selectedImage.split(";")[0].split(":")[1] || "image/jpeg";

      const cleanKey = apiKey.trim();
      const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
      ];
      let response: Response | null = null;
      let primaryErrMessage = "";

      for (const model of modelsToTry) {
        try {
          const isOAuthToken = cleanKey.startsWith("ya29.");
          const url = isOAuthToken
            ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
            : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (isOAuthToken) {
            headers["Authorization"] = `Bearer ${cleanKey}`;
          }

          const res = await fetch(url, {
            method: "POST",
            headers,
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
          });

          if (res.ok) {
            response = res;
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            const msg = errData?.error?.message || `HTTP ${res.status}`;
            if (!primaryErrMessage) {
              primaryErrMessage = msg;
            }
          }
        } catch (e) {
          if (!primaryErrMessage) {
            primaryErrMessage = e instanceof Error ? e.message : "Network error";
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Gemini API Error: ${primaryErrMessage || "Request failed"}. Please verify your API Key from aistudio.google.com.`);
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
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="sheet-drag-handle" />
        
        {/* Header with AI Badge */}
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
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Powered by Gemini 1.5 Vision AI</span>
            </div>
          </div>
          <button className="sheet-action-btn cancel" onClick={onClose}>
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

          {/* Gemini API Key Box */}
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="hero-eyebrow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>GEMINI API KEY (100% FREE AI VISION)</span>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.7rem", color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}
              >
                Get Free Key ↗
              </a>
            </div>
            <input
              type="password"
              placeholder="Paste your Gemini API key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-light)",
                fontSize: "0.85rem",
                marginTop: 6,
              }}
            />
          </div>

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
            {isScanning ? "✨ Scanning Receipt with AI..." : "⚡ Scan & Extract Expense Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
