// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddExpenseModal } from "./AddExpenseModal";

afterEach(cleanup);

describe("AddExpenseModal", () => {
  it("preserves scanned financial fields when saving", () => {
    const onSubmit = vi.fn();
    render(<AddExpenseModal isOpen onClose={vi.fn()} onSubmit={onSubmit} initialData={{ amount: 12.5, category: "Food & Dining", description: "Lunch", date: "2026-08-01", paymentMethod: "duitnow qr", tax: 0.75, serviceCharge: 1.25, items: [{ id: "tea", name: "Tea", qty: 1, unitPrice: 2, totalPrice: 2 }] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 12.5, paymentMethod: "QR code", tax: 0.75, serviceCharge: 1.25, items: [{ id: "tea", name: "Tea", qty: 1, unitPrice: 2, totalPrice: 2 }] }));
  });
});
