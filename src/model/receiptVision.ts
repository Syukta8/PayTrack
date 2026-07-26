import { PAYMENT_TYPES, normalizePaymentType } from "./types";

/** Vision-scanner domain module: prompt, transport, parsing and validation for receipt
 * extraction. Deliberately free of DOM and React so it can be exercised on its own. */

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const AMOUNT_CEILING = 1_000_000;

export interface ScannedItem {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface ScannedReceipt {
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

export type ScanOutcome = { ok: true; receipt: ScannedReceipt } | { ok: false; reason: string };

export const QUALITY_MESSAGE =
  "Low Quality Image Guard: this photo is too blurry, dark, or cropped to read reliably. Retake it with the whole receipt in frame and good lighting — nothing has been saved.";

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

/** The extraction instruction. Payment labels come from PAYMENT_TYPES so the model is asked
 * for the same vocabulary the picker and the sheet use. */
export function buildPrompt(): string {
  return `Extract the financial details and line items from this receipt image.
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
}`;
}

/** Validates a raw vision response before any of it can reach the ledger.
 * Anything unreadable, non-numeric, or impossible is rejected outright — this pipeline
 * never substitutes invented values for a failed extraction. */
export function validateReceipt(raw: unknown): ScanOutcome {
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

export interface ScanRequest {
  apiKey: string;
  base64Data: string;
  mimeType: string;
  /** Injectable for testing; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/** Sends one receipt image for extraction and returns a validated receipt or a reason.
 * Never throws for an expected failure — every outcome is reportable to the user. */
export async function scanReceipt({ apiKey, base64Data, mimeType, fetchImpl }: ScanRequest): Promise<ScanOutcome> {
  const doFetch = fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await doFetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
        contents: [{ parts: [{ text: buildPrompt() }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
      }),
    });
  } catch (err) {
    return {
      ok: false,
      reason: `Could not reach the scanner: ${err instanceof Error ? err.message : "network request failed"}. Nothing has been saved.`,
    };
  }

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    const hint =
      response.status === 400 || response.status === 401 || response.status === 403
        ? "Your Gemini API key looks invalid or lacks access to the Generative Language API."
        : response.status === 429
          ? "The Gemini API rate limit was hit. Wait a moment and scan again."
          : `The Gemini API returned an error (${response.status}).`;
    return { ok: false, reason: `${hint}${detail?.error?.message ? ` Details: ${detail.error.message}` : ""} Nothing has been saved.` };
  }

  const payload = (await response.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!rawText) {
    return { ok: false, reason: "The scanner returned an empty response, which usually means the image could not be interpreted. Please retake the photo." };
  }

  let rawReceipt: unknown;
  try {
    rawReceipt = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: "The scanner's response was not valid JSON, so it could not be trusted. Please try scanning again." };
  }

  return validateReceipt(rawReceipt);
}
