import { afterEach, describe, expect, it, vi } from "vitest";
import { coerceCellValue, SheetsRepository } from "./sheets";
import { SHEETS } from "./sheetSchema";

afterEach(() => vi.unstubAllGlobals());

function mockJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("coerceCellValue", () => {
  it("uses schema-safe defaults for blank cells", () => {
    expect(coerceCellValue(undefined, "number")).toBe(0);
    expect(coerceCellValue("", "boolean")).toBe(false);
    expect(coerceCellValue("", "string")).toBe("");
  });

  it("normalizes boolean and numeric values", () => {
    expect(coerceCellValue("TRUE", "boolean")).toBe(true);
    expect(coerceCellValue("12.5", "number")).toBe(12.5);
  });
});

describe("SheetsRepository", () => {
  it("maps typed rows, omits blank records, and preserves their sheet row number", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson({ values: [["txn-1", "2026-08-01", "expense", "Food & Dining", "12.5", "Lunch", "Cash", "", "created", "", ""], []] }));
    vi.stubGlobal("fetch", fetchMock);
    const rows = await new SheetsRepository("a".repeat(20), "token").list("transactions");
    expect(rows).toEqual([expect.objectContaining({ rowNumber: 2, data: expect.objectContaining({ id: "txn-1", amount: 12.5, tax: 0 }) })]);
    expect(fetchMock.mock.calls[0][0]).toContain("Transactions!A2%3AZ");
  });

  it("serializes append and update values in the schema column order", async () => {
    const fetchMock = vi.fn().mockImplementation(() => mockJson({}));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new SheetsRepository("a".repeat(20), "token");
    const transaction = { id: "txn-1", date: "2026-08-01", type: "expense" as const, category: "Food", amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "now", tax: 0, serviceCharge: 0 };
    await repository.append("transactions", transaction);
    await repository.update("transactions", 4, transaction);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer token" }) });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ values: [["txn-1", "2026-08-01", "expense", "Food", 12, "Lunch", "Cash", "", "now", 0, 0]] });
    expect(fetchMock.mock.calls[1][0]).toContain("Transactions!A4");
  });

  it("deletes requested rows bottom-up and reports expired access clearly", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockJson({ sheets: [{ properties: { title: "Transactions", sheetId: 42 } }] }))
      .mockResolvedValueOnce(mockJson({}));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new SheetsRepository("a".repeat(20), "token");
    await repository.deleteMany("transactions", [3, 5, 3]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).requests.map((request: { deleteDimension: { range: { startIndex: number } } }) => request.deleteDimension.range.startIndex)).toEqual([4, 2]);

    fetchMock.mockResolvedValueOnce(mockJson({}, 401));
    await expect(repository.list("bills")).rejects.toThrow("access has expired");
  });

  it("avoids requests for empty bulk writes and deletes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const repository = new SheetsRepository("a".repeat(20), "token");

    await repository.appendMany("transactions", []);
    await repository.deleteMany("transactions", []);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves actionable API failure messages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson({ error: { message: "Permission denied" } }, 403)));
    await expect(new SheetsRepository("a".repeat(20), "token").list("bills")).rejects.toThrow("Permission denied");
  });

  it("adds missing tabs and writes headers without touching existing data", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("?fields=sheets.properties.title")) return mockJson({ sheets: [] });
      if (url.includes(":batchUpdate")) return mockJson({});
      return mockJson({ values: [] });
    });
    vi.stubGlobal("fetch", fetchMock);

    await new SheetsRepository("a".repeat(20), "token").initializeTemplate();

    const batchRequest = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(batchRequest.requests).toHaveLength(Object.keys(SHEETS).length);
    const headerWrites = fetchMock.mock.calls.filter(([url, init]) => String(url).includes("valueInputOption=RAW") && init?.method === "PUT");
    expect(headerWrites).toHaveLength(Object.keys(SHEETS).length);
  });

  it("extends an older header but rejects a mismatched template", async () => {
    const existingTabs = Object.values(SHEETS).map((sheet) => ({ properties: { title: sheet.tab } }));
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("?fields=sheets.properties.title")) return mockJson({ sheets: existingTabs });
      if (url.includes("Transactions!A1%3AZ1")) return mockJson({ values: [["id", "date"]] });
      const sheet = Object.values(SHEETS).find((definition) => url.includes(`${definition.tab}!`));
      return mockJson({ values: [sheet?.columns.map(([name]) => String(name)) ?? []] });
    });
    vi.stubGlobal("fetch", fetchMock);
    await new SheetsRepository("a".repeat(20), "token").initializeTemplate();
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes("Transactions!A1") && init?.method === "PUT")).toBe(true);

    fetchMock.mockImplementation((url: string) => url.includes("?fields=sheets.properties.title")
      ? mockJson({ sheets: existingTabs })
      : mockJson({ values: [["wrong-column"]] }));
    await expect(new SheetsRepository("a".repeat(20), "token").initializeTemplate()).rejects.toThrow("does not match the PayTrack template");
  });
});
