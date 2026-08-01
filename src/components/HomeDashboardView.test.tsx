// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeDashboardView } from "./HomeDashboardView";

vi.mock("recharts", () => ({ AreaChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Area: () => null, ResponsiveContainer: ({ children }: { children: unknown }) => <div>{children as never}</div>, PieChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Pie: ({ children }: { children: unknown }) => <div>{children as never}</div>, Cell: () => null, BarChart: ({ children }: { children: unknown }) => <div>{children as never}</div>, Bar: ({ children }: { children: unknown }) => <div>{children as never}</div>, XAxis: () => null, YAxis: () => null, Tooltip: () => null }));

afterEach(cleanup);

describe("HomeDashboardView", () => {
  it("shows the actual item count and opens an eligible receipt", () => {
    const onSelectReceipt = vi.fn();
    render(<HomeDashboardView onSelectReceipt={onSelectReceipt} transactions={[{ id: "tx-1", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 12, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "", items: [{ id: "one", name: "Tea", qty: 1, unitPrice: 2, totalPrice: 2 }, { id: "two", name: "Rice", qty: 1, unitPrice: 10, totalPrice: 10 }] }]} />);
    expect(screen.getByText("2 items")).toBeTruthy();
    fireEvent.click(screen.getByText("Lunch"));
    expect(onSelectReceipt).toHaveBeenCalledWith(expect.objectContaining({ id: "tx-1" }));
  });
});
