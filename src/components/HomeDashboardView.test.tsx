// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeDashboardView } from "./HomeDashboardView";

vi.mock("recharts", () => ({ AreaChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Area: () => null, ResponsiveContainer: ({ children }: { children: unknown }) => <div>{children as never}</div>, PieChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Pie: ({ children }: { children: unknown }) => <div>{children as never}</div>, Cell: () => null, BarChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Bar: ({ children }: { children: unknown }) => <div>{children as never}</div>, XAxis: () => null, YAxis: () => null, Tooltip: () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HomeDashboardView", () => {
  it("shows the actual item count and opens an eligible receipt", () => {
    const onSelectReceipt = vi.fn();
    render(<HomeDashboardView onSelectReceipt={onSelectReceipt} transactions={[{ id: "tx-1", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "", items: [{ id: "one", name: "Tea", qty: 1, unitPrice: 2, totalPrice: 2 }, { id: "two", name: "Rice", qty: 1, unitPrice: 10, totalPrice: 10 }] }]} />);
    expect(screen.getByText("2 items")).toBeTruthy();
    fireEvent.click(screen.getByText("Lunch"));
    expect(onSelectReceipt).toHaveBeenCalledWith(expect.objectContaining({ id: "tx-1" }));
  });

  it("filters the selected month without opening ineligible transactions", () => {
    const onSelectReceipt = vi.fn();
    render(<HomeDashboardView onSelectReceipt={onSelectReceipt} transactions={[
      { id: "food", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "" },
      { id: "bill", date: "2026-08-02", type: "expense", category: "Bills & Utilities", amount: 50, description: "Electricity", paymentType: "Cash", remarks: "", createdAt: "" },
      { id: "older", date: "2026-07-01", type: "expense", category: "Food & Dining", amount: 8, description: "Breakfast", paymentType: "Cash", remarks: "", createdAt: "" },
    ]} />);

    fireEvent.change(screen.getByPlaceholderText("Search by store or item name"), { target: { value: "electric" } });
    expect(screen.getByText("Showing 1 out of 3 results")).toBeTruthy();
    fireEvent.click(screen.getByText("Electricity"));
    expect(onSelectReceipt).not.toHaveBeenCalled();
  });

  it("confirms deletion without selecting the receipt row", () => {
    const onSelectReceipt = vi.fn();
    const onDeleteTransaction = vi.fn(async () => undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<HomeDashboardView onSelectReceipt={onSelectReceipt} onDeleteTransaction={onDeleteTransaction} transactions={[{ id: "tx-1", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "" }]} />);

    fireEvent.click(screen.getByTitle("Delete expense"));
    expect(onDeleteTransaction).toHaveBeenCalledWith("tx-1");
    expect(onSelectReceipt).not.toHaveBeenCalled();
  });

  it("shows empty receipt and overview states safely", () => {
    render(<HomeDashboardView onSelectReceipt={vi.fn()} transactions={[]} />);
    expect(screen.getByText("No recent receipts recorded.")).toBeTruthy();
    fireEvent.click(screen.getByText("Overview"));
    expect(screen.getByText("No expense subcategory data recorded.")).toBeTruthy();
  });
});
