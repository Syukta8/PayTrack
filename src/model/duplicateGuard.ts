import type { Transaction, TransactionType } from "./types";

/** Detects a transaction that looks like it has already been recorded — most often the same
 * receipt scanned twice, or a scan repeated after a failed save. Advisory only: a real repeat
 * purchase (two coffees at the same shop on the same day) is legitimate, so callers warn
 * rather than block. */

export interface DuplicateCandidate {
  date: string;
  amount: number;
  description: string;
  type: TransactionType;
}

/** Cents comparison, so 12.30 and 12.299999999 are the same money. */
function sameAmount(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Merchant names arrive from OCR with inconsistent punctuation, spacing and case
 * ("7-ELEVEN MALAYSIA" vs "7 Eleven Malaysia"), so comparison ignores all of it. */
function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameDescription(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  // An empty description carries no signal either way, so date and amount decide alone.
  if (!left || !right) return true;
  if (left === right) return true;
  // One side is often a truncated or extended form of the other.
  return left.includes(right) || right.includes(left);
}

/** Returns every already-recorded transaction that matches the candidate on type, date,
 * amount and merchant. Ordered as given, so the caller can show the first as the example. */
export function findDuplicates(existing: Transaction[], candidate: DuplicateCandidate): Transaction[] {
  if (!candidate.date || !Number.isFinite(candidate.amount)) return [];
  return existing.filter(
    (row) =>
      row.type === candidate.type &&
      row.date === candidate.date &&
      sameAmount(row.amount, candidate.amount) &&
      sameDescription(row.description, candidate.description),
  );
}

/** User-facing wording for a suspected duplicate. States what matched and leaves the decision
 * with the user; it must never claim the entry is definitely wrong. */
export function describeDuplicate(matches: Transaction[], candidate: DuplicateCandidate): string | null {
  if (!matches.length) return null;
  const amount = candidate.amount.toFixed(2);
  const label = matches[0].description?.trim() || "no description";
  const others = matches.length > 1 ? ` (${matches.length} such entries exist)` : "";
  return `Possible duplicate: RM ${amount} on ${candidate.date} for "${label}" is already recorded${others}. Save anyway if this really is a separate purchase.`;
}
