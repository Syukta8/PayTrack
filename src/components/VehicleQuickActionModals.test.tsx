// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaintenanceServiceModal, OdometerModal } from "./VehicleQuickActionModals";

afterEach(cleanup);

describe("vehicle quick actions", () => {
  it("saves the latest odometer reading", () => {
    const onSave = vi.fn(async () => undefined);
    render(<OdometerModal isOpen currentMileage={1000} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Current mileage"), { target: { value: "1250" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(1250);
  });

  it("records the selected maintenance service with its mileage and cost", () => {
    const onSave = vi.fn(async () => undefined);
    render(<MaintenanceServiceModal isOpen carInfo={{ id: "car", currentMileage: 1000, updatedAt: "" }} maintenance={[{ item: { id: "oil", name: "Oil", notes: "", intervalMonths: 6, intervalKm: 0, lastServiceDate: "2026-01-01", lastServiceMileage: 1000, active: true }, nextDueDate: "2026-07-01", daysUntilDue: 0, nextDueMileage: null, kmUntilDue: null, status: "due_soon" }]} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Service mileage"), { target: { value: "1200" } });
    fireEvent.change(screen.getByLabelText("Service cost"), { target: { value: "85.5" } });
    fireEvent.change(screen.getByLabelText("Service notes"), { target: { value: "Oil and filter" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("oil", expect.objectContaining({ mileage: 1200, cost: 85.5, description: "Oil and filter" }));
  });
});
