import { PAYMENT_TYPES, normalizePaymentType } from "./types";
import { finiteReceiptNumber, isRealCalendarDate, localToday, parseReceiptItems } from "./receiptParsing";

/** Vision-scanner domain module: prompt, transport, parsing and validation for receipt
 * extraction. Deliberately free of DOM and React so it can be exercised on its own. */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const AMOUNT_CEILING = 1_000_000;

/** gemini-1.5-flash is legacy and closed to new projects, so the current fast multimodal
 * model is the default. Override with VITE_GEMINI_MODEL if your key needs a different one.
 * Read defensively: import.meta.env only exists under Vite, and this module is also loaded
 * outside the bundler when exercising the validator directly. */
const GEMINI_MODEL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL) || "gemini-2.5-flash";

/** Statuses worth one more attempt: rate limiting and transient server/overload errors. */
const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAY_MS = 1_500;
const MAX_ATTEMPTS = 2;

/** Constrains the model to the exact shape the validator expects, so a well-formed reply is
 * the default rather than something coaxed out of a free-text prompt. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    merchantName: { type: "STRING" },
    totalAmount: { type: "NUMBER" },
    tax: { type: "NUMBER" },
    serviceCharge: { type: "NUMBER" },
    date: { type: "STRING" },
    category: { type: "STRING", enum: ["Food & Dining", "Shopping", "Entertainment", "Bills & Utilities", "Personal", "Transport"] },
    paymentMethod: { type: "STRING", enum: [...PAYMENT_TYPES] },
    note: { type: "STRING" },
    isQualityLow: { type: "BOOLEAN" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          qty: { type: "NUMBER" },
          unitPrice: { type: "NUMBER" },
          totalPrice: { type: "NUMBER" },
          category: { type: "STRING" },
        },
        required: ["name", "totalPrice"],
      },
    },
  },
  required: ["merchantName", "totalAmount", "date", "isQualityLow"],
} as const;

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
type ValidationResult<T> = { ok: true } & T | { ok: false; reason: string };

export const QUALITY_MESSAGE =
  "Low Quality Image Guard: this photo is too blurry, dark, or cropped to read reliably. Retake it with the whole receipt in frame and good lighting — nothing has been saved.";

/** Returns a trimmed scanner string only when it carries a meaningful value. */
function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Keeps malformed dates editable while rejecting a clearly impossible future receipt. */
function resolveReceiptDate(value: unknown): ValidationResult<{ date: string }> {
  const rawDate = optionalText(value);
  if (!rawDate || !isRealCalendarDate(rawDate)) return { ok: true, date: localToday() };
  if (rawDate > localToday()) {
    return { ok: false, reason: `The scanner read the receipt date as ${rawDate}, which is in the future. Please retake the photo or enter this receipt manually.` };
  }
  return { ok: true, date: rawDate };
}

/** Rejects unusable or implausibly large receipt totals before ledger fields are assembled. */
function resolveReceiptTotal(value: unknown): ValidationResult<{ totalAmount: number }> {
  const totalAmount = finiteReceiptNumber(value);
  if (totalAmount === null || totalAmount <= 0) return { ok: false, reason: QUALITY_MESSAGE };
  if (totalAmount > AMOUNT_CEILING) {
    return { ok: false, reason: `The scanner read a total of RM${totalAmount.toFixed(2)}, which looks like a misread. Please retake the photo or enter this receipt manually.` };
  }
  return { ok: true, totalAmount };
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

  const total = resolveReceiptTotal(source.totalAmount);
  if (!total.ok) return total;
  const receiptDate = resolveReceiptDate(source.date);
  if (!receiptDate.ok) return receiptDate;
  const merchantName = optionalText(source.merchantName) ?? "";
  if (!merchantName) return { ok: false, reason: QUALITY_MESSAGE };

  const items = parseReceiptItems(source.items);

  return {
    ok: true,
    receipt: {
      merchantName,
      totalAmount: total.totalAmount,
      tax: finiteReceiptNumber(source.tax) ?? 0,
      serviceCharge: finiteReceiptNumber(source.serviceCharge) ?? 0,
      date: receiptDate.date,
      category: optionalText(source.category) ?? "Shopping",
      note: optionalText(source.note) ?? merchantName,
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
  /** Injectable for testing so a retry does not really wait. */
  sleepImpl?: (ms: number) => Promise<void>;
}

interface VisionPayload {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/** Turns an HTTP failure into something the user can act on. */
function describeHttpFailure(status: number, message: string | undefined): string {
  const hints: Record<number, string> = {
    400: "The scan request was rejected as malformed, which usually means an invalid API key or an unsupported image.",
    401: "Your Gemini API key is invalid or lacks access to the Generative Language API.",
    403: "Your Gemini API key is invalid or lacks access to the Generative Language API.",
    404: `The configured model (${GEMINI_MODEL}) is not available to your API key. Set VITE_GEMINI_MODEL to one your key can use.`,
    413: "The receipt image was too large for the API. Try a tighter crop of the receipt.",
    429: "The Gemini API rate limit was hit. Wait a moment and scan again.",
  };
  const hint = hints[status] ?? `The Gemini API returned an error (${status}).`;
  return `${hint}${message ? ` Details: ${message}` : ""} Nothing has been saved.`;
}

/** Decodes a successful Gemini response before passing only trusted JSON into receipt validation. */
function decodeVisionPayload(payload: VisionPayload | null): ScanOutcome {
  if (payload?.promptFeedback?.blockReason) {
    return { ok: false, reason: `The scanner refused this image (${payload.promptFeedback.blockReason}). Please use a photo of a printed receipt.` };
  }
  const finishReason = payload?.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") return { ok: false, reason: "The receipt was too long for the scanner to finish reading, so the result was incomplete. Try scanning it in two halves." };
  if (finishReason && finishReason !== "STOP") return { ok: false, reason: `The scanner stopped early (${finishReason}) and returned no usable result. Please retake the photo and try again.` };
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!rawText) return { ok: false, reason: "The scanner returned an empty response, which usually means the image could not be interpreted. Please retake the photo." };
  try {
    return validateReceipt(JSON.parse(rawText));
  } catch {
    return { ok: false, reason: "The scanner's response was not valid JSON, so it could not be trusted. Please try scanning again." };
  }
}

/** Sends one receipt image for extraction and returns a validated receipt or a reason.
 * Never throws for an expected failure — every outcome is reportable to the user. */
export async function scanReceipt({ apiKey, base64Data, mimeType, fetchImpl, sleepImpl }: ScanRequest): Promise<ScanOutcome> {
  const doFetch = fetchImpl ?? fetch;
  const sleep = sleepImpl ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const body = JSON.stringify({
    generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
    contents: [{ parts: [{ text: buildPrompt() }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
  });

  let response: Response | null = null;
  let lastReason = "The scan could not be completed. Please try again.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(RETRY_DELAY_MS);
    let candidate: Response;
    try {
      candidate = await doFetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
      });
    } catch (err) {
      // A dropped connection is worth one more attempt before giving up.
      lastReason = `Could not reach the scanner: ${err instanceof Error ? err.message : "network request failed"}. Nothing has been saved.`;
      continue;
    }

    if (candidate.ok) {
      response = candidate;
      break;
    }

    const detail = (await candidate.json().catch(() => null)) as { error?: { message?: string } } | null;
    lastReason = describeHttpFailure(candidate.status, detail?.error?.message);
    if (!RETRYABLE_STATUSES.has(candidate.status)) return { ok: false, reason: lastReason };
  }

  if (!response) return { ok: false, reason: lastReason };

  return decodeVisionPayload((await response.json().catch(() => null)) as VisionPayload | null);
}
