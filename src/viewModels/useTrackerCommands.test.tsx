// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Tracker } from "../model/tracker";
import { useTrackerCommands } from "./useTrackerCommands";

describe("useTrackerCommands", () => {
  it("reloads after a tracker mutation and reports a failed mutation", async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    const reportError = vi.fn();
    const tracker = {
      deleteTransaction: vi.fn().mockResolvedValue(undefined),
      deleteBill: vi.fn().mockRejectedValue(new Error("Sheet unavailable")),
    } as unknown as Tracker;
    const { result } = renderHook(() => useTrackerCommands(tracker, reload, reportError));

    await act(async () => { await result.current.deleteTransaction("txn-1"); });
    await act(async () => { await result.current.deleteBill("bill-1"); });

    expect(tracker.deleteTransaction).toHaveBeenCalledWith("txn-1");
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith("Sheet unavailable");
  });

  it("imports reconciled items in order and reloads only after the full batch", async () => {
    const events: string[] = [];
    const reload = vi.fn(async () => { events.push("reload"); });
    const tracker = {
      addTransaction: vi.fn(async (item) => { events.push(item.description); }),
    } as unknown as Tracker;
    const { result } = renderHook(() => useTrackerCommands(tracker, reload, vi.fn()));

    await act(async () => {
      await result.current.importReconciledItems([
        { date: "2026-08-01", amount: 10, category: "Food & Dining", description: "Lunch", paymentMethod: "Cash" },
        { date: "2026-08-02", amount: 20, category: "Transport", description: "Fuel", paymentMethod: "Debit card" },
      ]);
    });

    expect(tracker.addTransaction).toHaveBeenNthCalledWith(1, expect.objectContaining({ description: "Lunch", remarks: "Reconciled from Bank Statement" }));
    expect(tracker.addTransaction).toHaveBeenNthCalledWith(2, expect.objectContaining({ description: "Fuel" }));
    expect(events).toEqual(["Lunch", "Fuel", "reload"]);
  });

  it("reports an import failure and does not reload partial data as completed", async () => {
    const reload = vi.fn();
    const reportError = vi.fn();
    const tracker = { addTransaction: vi.fn().mockRejectedValue(new Error("Sheet unavailable")) } as unknown as Tracker;
    const { result } = renderHook(() => useTrackerCommands(tracker, reload, reportError));

    await act(async () => { await result.current.importReconciledItems([{ date: "2026-08-01", amount: 10, category: "Food & Dining", description: "Lunch", paymentMethod: "Cash" }]); });

    expect(reload).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledWith("Sheet unavailable");
  });
});
