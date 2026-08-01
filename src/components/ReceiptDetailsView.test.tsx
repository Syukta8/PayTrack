// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptDetailsView } from "./ReceiptDetailsView";
import { getReceiptImage, getReceiptItems } from "../model/imageStore";
import { restoreLegacyReceiptItems } from "../model/receiptItems";

vi.mock("../model/imageStore", () => ({ getReceiptImage: vi.fn(async () => null), getReceiptItems: vi.fn(async () => []) }));
vi.mock("../model/receiptItems", () => ({ restoreLegacyReceiptItems: vi.fn(() => []) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(getReceiptImage).mockResolvedValue(null);
  vi.mocked(getReceiptItems).mockResolvedValue([]);
  vi.mocked(restoreLegacyReceiptItems).mockReturnValue([]);
});

const receipt = {
  id: "receipt-1", date: "2026-08-01", type: "expense" as const, category: "Food & Dining",
  amount: 10, description: "Lunch", paymentType: "Cash", remarks: "", createdAt: "",
};

describe("ReceiptDetailsView", () => {
  it("shows persisted receipt line items", async () => {
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={{ ...receipt, items: [{ id: "item-1", name: "Nasi lemak", qty: 1, unitPrice: 10, totalPrice: 10 }] }} />);
    expect(await screen.findByText("Nasi lemak")).toBeTruthy();
    expect(screen.getByText("1 items in total")).toBeTruthy();
    expect(getReceiptItems).not.toHaveBeenCalled();
  });

  it("uses cached legacy items and a browser-only image when the sheet has no items", async () => {
    vi.mocked(getReceiptImage).mockResolvedValue("data:image/png;base64,receipt");
    vi.mocked(getReceiptItems).mockResolvedValue([{ id: "legacy-1", name: "Teh tarik", qty: 1, unitPrice: 3, totalPrice: 3 }]);
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={receipt} />);

    expect(await screen.findByText("Teh tarik")).toBeTruthy();
    fireEvent.click(screen.getByText("Image"));
    expect(await screen.findByAltText("Scanned Receipt - Lunch")).toBeTruthy();
  });

  it("reconstructs legacy items when no cached items remain", async () => {
    vi.mocked(getReceiptItems).mockResolvedValue(null);
    vi.mocked(restoreLegacyReceiptItems).mockReturnValue([{ id: "restored", name: "Legacy rice", qty: 1, unitPrice: 10, totalPrice: 10 }]);
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={receipt} />);

    expect(await screen.findByText("Legacy rice")).toBeTruthy();
  });

  it("warns without hiding the receipt when browser storage fails", async () => {
    vi.mocked(getReceiptImage).mockRejectedValue(new Error("IndexedDB unavailable"));
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={receipt} />);

    expect((await screen.findByRole("status")).textContent).toContain("Some receipt data could not be loaded");
    expect(screen.getByText("Lunch")).toBeTruthy();
  });

  it("filters line items and reports a fee-aware discrepancy", async () => {
    vi.mocked(getReceiptImage).mockResolvedValue(null);
    render(<ReceiptDetailsView onBack={vi.fn()} receipt={{ ...receipt, amount: 20, paymentType: "SPayLater 3M", tax: 0, serviceCharge: 0, items: [{ id: "tea", name: "Tea", qty: 1, unitPrice: 5, totalPrice: 5 }, { id: "rice", name: "Rice", qty: 1, unitPrice: 5, totalPrice: 5 }] }} />);
    await screen.findByText("Tea");
    fireEvent.change(screen.getByPlaceholderText("Search by item name"), { target: { value: "rice" } });
    expect(screen.getByText("Rice")).toBeTruthy();
    expect(screen.queryByText("Tea")).toBeNull();
    expect(screen.getByText(/Subitem Discrepancy Detected/)).toBeTruthy();
  });
});
