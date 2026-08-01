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
});
