import React, { useRef, useState } from "react";
import { PAYMENT_TYPES, normalizePaymentType } from "../model/types";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: {
    amount: number;
    tax?: number;
    serviceCharge?: number;
    category: string;
    description: string;
    date: string;
    note: string;
    imageUrl?: string;
    driveUrl?: string;
    paymentMethod?: string;
    items?: Array<{
      id: string;
      name: string;
      qty: number;
      unitPrice: number;
      totalPrice: number;
      category?: string;
    }>;
  }) => void;
}

/** Receipt text legibility depends on horizontal resolution, so width is clamped and
 * height is left free â a tall thermal receipt must not be squeezed to fit a square box.
 * MAX_PIXELS keeps very long receipts inside a sane request size. */
const MAX_WIDTH = 1100;
const MAX_PIXELS = 6_000_000;
const MIN_LEGIBLE_WIDTH = 800;
const JPEG_QUALITY = 0.9;

interface PreparedImage {
  dataUrl: string;
  sourceWidth: number;
  width: number;
}

/** Reads a photo's intrinsic width so the user can be warned before spending a scan. */
function measureWidth(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width);
    img.onerror = () => resolve(0);
    img.src = dataUrl;
  });
}

/** Scales a receipt photo by width only, preserving its aspect ratio and vertical detail. */
function prepareImage(dataUrl: string): Promise<PreparedImage> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const sourceWidth = img.width;
      if (!sourceWidth || !img.height) {
        resolve({ dataUrl, sourceWidth: 0, width: 0 });
        return;
      }

      let scale = sourceWidth > MAX_WIDTH ? MAX_WIDTH / sourceWidth : 1;
      const scaledPixels = sourceWidth * scale * img.height * scale;
      if (scaledPixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / scaledPixels);

      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, sourceWidth, width: sourceWidth });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), sourceWidth, width });
    };
    img.onerror = () => resolve({ dataUrl, sourceWidth: 0, width: 0 });
    img.src = dataUrl;
  });
}

const GEMINI_MODEL = "gemini-1.5-flash";
const AMOUNT_CEILING = 1_000_000;

interface ScannedItem {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

interface ScannedReceipt {
  merchantName: string;
  totalAmount: number;
  tax: number;
  serviceCharge: number;
  date: string;
  category: string;
  note: string;
  paymentMethod?: string;
  items: ScannedItem[];
}

type ScanResult = { ok: true; receipt: ScannedReceipt } | { ok: false; reason: string };

const QUALITY_MESSAGE =
  "Low Quality Image Guard: this photo is too blurry, dark, or cropped to read reliably. Retake it with the whole receipt in frame and good lighting â nothing has been saved.";

/** Parses a currency-ish value, rejecting anything that is not genuinely numeric.
 * Stripping symbols is not enough: Number("") is 0, so a garbage string such as "NaN"
 * would otherwise be accepted as a real zero. */
function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Validates a raw vision response before any of it can reach the ledger.
 * Anything unreadable, non-numeric, or impossible is rejected outright â this pipeline
 * never substitutes invented values for a failed extraction. */
function validateReceipt(raw: unknown): ScanResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "The scanner returned an unreadable response. Please try again." };
  const source = raw as Record<string, unknown>;

  if (source.isQualityLow === true || source.isQualityLow === "true") return { ok: false, reason: QUALITY_MESSAGE };

  const totalAmount = finiteNumber(source.totalAmount);
  if (totalAmount === null || totalAmount <= 0) return { ok: false, reason: QUALITY_MESSAGE };
  if (totalAmount > AMOUNT_CEILING) {
    return { ok: false, reason: `The scanner read a total of RM${totalAmount.toFixed(2)}, which looks like a misread. Please retake the photo or enter this receipt manually.` };
  }

  // A future date always means a misread; an absent or malformed one falls back to today,
  // which the user reviews in the editable form before saving.
  const rawDate = typeof source.date === "string" ? source.date.trim() : "";
  let date = localToday();
  if (rawDate && isRealCalendarDate(rawDate)) {
    if (rawDate > localToday()) {
      return { ok: false, reason: `The scanner read the receipt date as ${rawDate}, which is in the future. Please retake the photo or enter this receipt manually.` };
    }
    date = rawDate;
  }

  const merchantName = typeof source.merchantName === "string" && source.merchantName.trim() ? source.merchantName.trim() : "";
  if (!merchantName) return { ok: false, reason: QUALITY_MESSAGE };

  const rawItems = Array.isArray(source.items) ? source.items : [];
  const items: ScannedItem[] = [];
  rawItems.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const item = entry as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const qty = finiteNumber(item.qty);
    const unitPrice = finiteNumber(item.unitPrice);
    let totalPrice = finiteNumber(item.totalPrice);
    if (totalPrice === null && qty !== null && unitPrice !== null) totalPrice = qty * unitPrice;
    // Drop unusable rows rather than guess: a short items list surfaces as a visible
    // subtotal mismatch in the add-expense form instead of a silently wrong total.
    if (!name || totalPrice === null || totalPrice < 0) return;
    items.push({
      name,
      qty: qty !== null && qty > 0 ? qty : 1,
      unitPrice: unitPrice !== null && unitPrice >= 0 ? unitPrice : totalPrice,
      totalPrice,
      category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : undefined,
    });
  });

  return {
    ok: true,
    receipt: {
      merchantName,
      totalAmount,
      tax: finiteNumber(source.tax) ?? 0,
      serviceCharge: finiteNumber(source.serviceCharge) ?? 0,
      date,
      category: typeof source.category === "string" && source.category.trim() ? source.category.trim() : "Shopping",
      note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : merchantName,
      paymentMethod: normalizePaymentType(typeof source.paymentMethod === "string" ? source.paymentMethod : null) ?? undefined,
      items,
    },
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
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedImage(null);
    setErrorMessage(null);
    setWarningMessage(null);
    setIsScanning(false);
    setStatusText("");
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      setErrorMessage(null);
      const width = await measureWidth(dataUrl);
      setWarningMessage(
        width > 0 && width < MIN_LEGIBLE_WIDTH
          ? `This photo is only ${width}px wide. Receipt text below ${MIN_LEGIBLE_WIDTH}px often reads incorrectly — consider retaking it closer or in better light.`
          : null,
      );
    };
    reader.readAsDataURL(file);
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      setErrorMessage("Please snap a photo or upload a receipt image first.");
      return;
    }

    const apiKey = localStorage.getItem("paytrack.geminiApiKey")?.trim();
    if (!apiKey) {
      setErrorMessage(
        "Scanner not configured: no Gemini API key is set, so this receipt cannot be read. Add your key to continue, or close this and enter the expense manually.",
      );
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setStatusText("⚡ Preparing receipt image...");

    try {
      const prepared = await prepareImage(selectedImage);
      const base64Data = prepared.dataUrl.split(",")[1];
      const mimeType = prepared.dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
      if (!base64Data) {
        setErrorMessage("That file could not be read as an image. Please choose a photo of the receipt.");
        return;
      }

      setStatusText("🤖 Reading receipt with AI Vision...");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
            contents: [
              {
                parts: [
                  {
                    text: `Extract the financial details and line items from this receipt image.
Read only what is actually printed. Never invent, infer, or complete a value you cannot see.
If the image is blurry, dark, cropped, or is not a receipt, set "isQualityLow" to true and "totalAmount" to 0.
Respond with JSON only, matching this structure:
{
  "merchantName": "Store Name",
  "totalAmount": 0.00,
  "tax": 0.00,
  "serviceCharge": 0.00,
  "date": "YYYY-MM-DD",
  "category": "Food & Dining" | "Shopping" | "Entertainment" | "Bills & Utilities" | "Personal" | "Transport",
  "paymentMethod": ${PAYMENT_TYPES.map((type) => `"${type}"`).join(" | ")},
  "note": "summary of store/location",
  "isQualityLow": false,
  "items": [
    { "name": "Item Description", "qty": 1, "unitPrice": 10.00, "totalPrice": 10.00, "category": "Groceries" }
  ]
}`,
                  },
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        const hint =
          response.status === 400 || response.status === 401 || response.status === 403
            ? "Your Gemini API key looks invalid or lacks access to the Generative Language API."
            : response.status === 429
              ? "The Gemini API rate limit was hit. Wait a moment and scan again."
              : `The Gemini API returned an error (${response.status}).`;
        setErrorMessage(`${hint}${detail?.error?.message ? ` Details: ${detail.error.message}` : ""} Nothing has been saved.`);
        return;
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      if (!rawText) {
        setErrorMessage("The scanner returned an empty response, which usually means the image could not be interpreted. Please retake the photo.");
        return;
      }

      let rawReceipt: unknown;
      try {
        rawReceipt = JSON.parse(rawText);
      } catch {
        setErrorMessage("The scanner's response was not valid JSON, so it could not be trusted. Please try scanning again.");
        return;
      }

      const result = validateReceipt(rawReceipt);
      if (!result.ok) {
        setErrorMessage(result.reason);
        return;
      }

      const { receipt } = result;
      const stamp = Date.now().toString(36);
      const driveFolder = `PayTrack_Receipts/${receipt.date.slice(0, 4)}/${receipt.date.slice(5, 7)}/rcpt_${stamp}.jpg`;

      onReceiptScanned({
        amount: receipt.totalAmount,
        tax: receipt.tax,
        serviceCharge: receipt.serviceCharge,
        category: receipt.category,
        description: receipt.merchantName,
        date: receipt.date,
        note: receipt.note,
        paymentMethod: receipt.paymentMethod,
        imageUrl: prepared.dataUrl,
        driveUrl: `Google Drive: ${driveFolder}`,
        items: receipt.items.map((item, index) => ({
          id: `item_${stamp}_${index}`,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category ?? receipt.category,
        })),
      });

      handleClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? `Could not reach the scanner: ${err.message}. Nothing has been saved.`
          : "Could not reach the scanner. Check your connection and try again. Nothing has been saved.",
      );
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
