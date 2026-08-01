import { afterEach, describe, expect, it, vi } from "vitest";
import { getReceiptImage, getReceiptItems, saveReceiptImage } from "./imageStore";

function createIndexedDb(imageValue: string | undefined, itemValue: unknown, failOpen = false) {
  const transaction = {
    objectStore: vi.fn((name: string) => ({
      put: vi.fn(),
      get: vi.fn(() => {
        const request = { result: name === "receipt_images" ? imageValue : itemValue, error: null } as unknown as IDBRequest;
        queueMicrotask(() => request.onsuccess?.(new Event("success")));
        return request;
      }),
    })),
    oncomplete: null,
    onerror: null,
    error: null,
  } as unknown as IDBTransaction;
  const database = {
    objectStoreNames: { contains: () => true },
    transaction: vi.fn(() => {
      queueMicrotask(() => transaction.oncomplete?.(new Event("complete")));
      return transaction;
    }),
  } as unknown as IDBDatabase;
  const factory = {
    open: vi.fn(() => {
      const request = { result: database, error: failOpen ? new Error("blocked") : null } as unknown as IDBOpenDBRequest;
      queueMicrotask(() => {
        if (failOpen) request.onerror?.(new Event("error"));
        else request.onsuccess?.(new Event("success"));
      });
      return request;
    }),
  } as unknown as IDBFactory;
  vi.stubGlobal("indexedDB", factory);
  return { factory, database, transaction };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("imageStore", () => {
  it("saves and reads browser-local receipt images", async () => {
    const { transaction } = createIndexedDb("data:image/png;base64,receipt", null);

    await saveReceiptImage("receipt-1", "data:image/png;base64,receipt");
    await expect(getReceiptImage("receipt-1")).resolves.toBe("data:image/png;base64,receipt");

    expect(transaction.objectStore).toHaveBeenCalledWith("receipt_images");
  });

  it("reads legacy receipt items without treating them as a write store", async () => {
    createIndexedDb(undefined, [{ id: "item-1", name: "Rice", qty: 1, unitPrice: 5, totalPrice: 5 }]);

    await expect(getReceiptItems("receipt-1")).resolves.toEqual([expect.objectContaining({ name: "Rice" })]);
  });

  it("returns safe empty results when IndexedDB is unavailable or records are absent", async () => {
    createIndexedDb(undefined, undefined, true);
    await expect(getReceiptImage("receipt-1")).resolves.toBeNull();
    await expect(getReceiptItems("receipt-1")).resolves.toBeNull();
    await expect(getReceiptImage("")).resolves.toBeNull();
    await expect(getReceiptItems("")).resolves.toBeNull();
  });

  it("does not attempt empty image writes and keeps storage failures non-fatal", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { factory } = createIndexedDb(undefined, null, true);

    await saveReceiptImage("", "data:image/png;base64,receipt");
    expect(factory.open).not.toHaveBeenCalled();
    await expect(saveReceiptImage("receipt-1", "data:image/png;base64,receipt")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});
