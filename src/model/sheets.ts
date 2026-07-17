import { SHEETS } from "./sheetSchema";
import type { CellType, SheetEntity, SheetRecord } from "./sheetSchema";

const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";

export interface RowRecord<T> { rowNumber: number; data: T; }

/** Extracts the spreadsheet identifier from a Google Sheets URL or accepts a raw identifier. */
export function spreadsheetIdFrom(value: string): string {
  const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const id = match?.[1] ?? value.trim();
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(id)) throw new Error("Enter a valid Google Sheets link or spreadsheet ID.");
  return id;
}

function coerce(value: unknown, type: CellType): string | number | boolean {
  if (value === undefined || value === "") return type === "number" ? 0 : type === "boolean" ? false : "";
  if (type === "number") return Number(value);
  if (type === "boolean") return value === true || value === "true" || value === "TRUE" || value === "1";
  return String(value);
}

/** Browser-only repository for the owner's private Google Sheet. */
export class SheetsRepository {
  public constructor(private readonly spreadsheetId: string, private readonly accessToken: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_ROOT}/${this.spreadsheetId}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json", ...init?.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(body?.error?.message ?? `Google Sheets request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  }

  /** Lists rows after the header, preserving each row number for later updates or deletion. */
  public async list<K extends SheetEntity>(entity: K): Promise<RowRecord<SheetRecord<K>>[]> {
    const definition = SHEETS[entity];
    const range = encodeURIComponent(`${definition.tab}!A2:Z`);
    const result = await this.request<{ values?: unknown[][] }>(`/values/${range}`);
    return (result.values ?? []).map((row, index) => {
      const data = {} as SheetRecord<K>;
      definition.columns.forEach(([key, type], columnIndex) => {
        (data as unknown as Record<string, unknown>)[String(key)] = coerce(row[columnIndex], type);
      });
      return { rowNumber: index + 2, data };
    }).filter((row) => Object.values(row.data).some((value) => value !== "" && value !== 0 && value !== false));
  }

  /** Appends a typed record to its entity tab. */
  public async append<K extends SheetEntity>(entity: K, data: SheetRecord<K>): Promise<void> {
    const definition = SHEETS[entity];
    const values = definition.columns.map(([key]) => (data as unknown as Record<string, unknown>)[String(key)] ?? "");
    await this.request(`/values/${encodeURIComponent(`${definition.tab}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST", body: JSON.stringify({ values: [values] }),
    });
  }

  /** Replaces a row using the schema's stable column order. */
  public async update<K extends SheetEntity>(entity: K, rowNumber: number, data: SheetRecord<K>): Promise<void> {
    const definition = SHEETS[entity];
    const values = definition.columns.map(([key]) => (data as unknown as Record<string, unknown>)[String(key)] ?? "");
    await this.request(`/values/${encodeURIComponent(`${definition.tab}!A${rowNumber}`)}?valueInputOption=RAW`, {
      method: "PUT", body: JSON.stringify({ values: [values] }),
    });
  }

  /** Deletes one data row while retaining the entity's header row. */
  public async delete(entity: SheetEntity, rowNumber: number): Promise<void> {
    const tab = SHEETS[entity].tab;
    const metadata = await this.request<{ sheets?: { properties?: { title?: string; sheetId?: number } }[] }>("?fields=sheets.properties(title,sheetId)");
    const sheetId = metadata.sheets?.find((sheet) => sheet.properties?.title === tab)?.properties?.sheetId;
    if (sheetId === undefined) throw new Error(`The ${tab} tab does not exist. Initialize the template first.`);
    await this.request(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber } } }] }),
    });
  }

  /** Creates missing tabs and writes the required header rows without exposing the workbook publicly. */
  public async initializeTemplate(): Promise<void> {
    const metadata = await this.request<{ sheets?: { properties?: { title?: string } }[] }>("?fields=sheets.properties.title");
    const existing = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties?.title));
    const missing = Object.values(SHEETS).filter((sheet) => !existing.has(sheet.tab));
    if (missing.length) await this.request(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: missing.map((sheet) => ({ addSheet: { properties: { title: sheet.tab } } })) }) });
    await Promise.all(Object.values(SHEETS).map((sheet) => this.request(`/values/${encodeURIComponent(`${sheet.tab}!A1`)}?valueInputOption=RAW`, {
      method: "PUT", body: JSON.stringify({ values: [sheet.columns.map(([name]) => String(name))] }),
    })));
  }
}
