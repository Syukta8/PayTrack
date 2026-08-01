// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BillEditorModal } from "./BillEditorModal";

afterEach(cleanup);

describe("BillEditorModal", () => {
  it("forwards edited bill fields and closes without saving when cancelled", () => {
    const onNameChange = vi.fn();
    const onDueDayChange = vi.fn();
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<BillEditorModal isOpen isEditing={false} name="" amount="" dueDay="1" recurrence="monthly" paymentType="Cash" onClose={onClose} onSave={onSave} onNameChange={onNameChange} onAmountChange={vi.fn()} onDueDayChange={onDueDayChange} onRecurrenceChange={vi.fn()} onPaymentTypeChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/unifi fiber/i), { target: { value: "Internet" } });
    fireEvent.click(screen.getByRole("button", { name: "15" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onNameChange).toHaveBeenCalledWith("Internet");
    expect(onDueDayChange).toHaveBeenCalledWith("15");
    expect(onSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
