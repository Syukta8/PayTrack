/** Resolves the Gemini API key for the receipt scanner. Kept separate from receiptVision so
 * the resolution rules can be exercised without a browser, and so the scanner transport never
 * reads global state itself. */

/** Legacy location: earlier builds had no env var, so the key had to be pasted into devtools.
 * Still honoured, so anyone already set up does not lose their scanner. */
export const API_KEY_STORAGE = "paytrack.geminiApiKey";

export type ApiKeySource = "env" | "storage";

export interface ResolvedApiKey {
  key: string;
  source: ApiKeySource;
}

export interface ApiKeyInputs {
  /** import.meta.env.VITE_GEMINI_API_KEY at build time. */
  envKey?: string | null;
  /** localStorage["paytrack.geminiApiKey"]. */
  storedKey?: string | null;
}

export const MISSING_KEY_MESSAGE =
  "Scanner not configured: no Gemini API key is available, so this receipt cannot be read. " +
  "Set VITE_GEMINI_API_KEY in .env and rebuild, or close this and enter the expense manually.";

/** The build-time env var wins so a deployed bundle behaves the same for everyone; the
 * localStorage key is the fallback for setups that predate the env var. */
export function resolveApiKey({ envKey, storedKey }: ApiKeyInputs): ResolvedApiKey | null {
  const fromEnv = envKey?.trim();
  if (fromEnv) return { key: fromEnv, source: "env" };
  const fromStorage = storedKey?.trim();
  if (fromStorage) return { key: fromStorage, source: "storage" };
  return null;
}

/** Browser wiring for resolveApiKey. Reads defensively: import.meta.env only exists under
 * Vite, and localStorage is absent outside a browser. */
export function readApiKey(): ResolvedApiKey | null {
  const envKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) || null;
  let storedKey: string | null = null;
  try {
    storedKey = typeof localStorage !== "undefined" ? localStorage.getItem(API_KEY_STORAGE) : null;
  } catch {
    // Private-mode or blocked storage: treat as no key rather than breaking the scanner.
    storedKey = null;
  }
  return resolveApiKey({ envKey, storedKey });
}
