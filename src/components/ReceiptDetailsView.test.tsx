// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptDetailsView } from "./ReceiptDetailsView";

vi.mock("../model/imageStore", () => ({ getReceiptImage: vi.fn(async () => null), getReceiptItems: vi.fn(async () => []) }));

afterEach(cleanup);

describe("ReceiptDetailsView", () => {
  it("shows persisted receipt line items", async () => {
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={{ id: "receipt-1", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 10, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "", items: [{ id: "item-1", name: "Nasi lemak", qty: 1, unitPrice: 10, totalPrice: 10 }] }} />);
    expect(await screen.findByText("Nasi lemak")).toBeTruthy();
    expect(screen.getByText("1 items in total")).toBeTruthy();
  });
});
