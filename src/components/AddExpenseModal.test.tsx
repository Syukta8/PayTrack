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

  it("submits the fee-inclusive total for a multi-month SPayLater expense", () => {
    const onSubmit = vi.fn();
    render(<AddExpenseModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "SPayLater" }));
    fireEvent.click(screen.getByRole("button", { name: /6 months/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 109.00000000000001, paymentMethod: "SPayLater 6M" }));
  });

  it("warns about duplicates and lets the user sync a mismatched receipt total", () => {
    render(<AddExpenseModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} existingTransactions={[{ id: "existing", date: "2026-08-01", type: "expense", category: "Food & Dining", amount: 8, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "" }]} initialData={{ amount: 8, category: "Food & Dining", description: "Lunch", date: "2026-08-01", paymentMethod: "Cash", items: [{ id: "item", name: "Rice", qty: 1, unitPrice: 5, totalPrice: 5 }] }} />);
    expect(screen.getByText(/possible duplicate/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /sync base amount/i }));
    expect((screen.getByPlaceholderText("0.00") as HTMLInputElement).value).toBe("5.00");
  });
});
