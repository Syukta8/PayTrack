import { afterEach, describe, expect, it, vi } from "vitest";
import { coerceCellValue, SheetsRepository } from "./sheets";

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
});
