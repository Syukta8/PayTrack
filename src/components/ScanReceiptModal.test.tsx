// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScanReceiptModal } from "./ScanReceiptModal";

vi.mock("../viewModels/useReceiptScannerViewModel", () => ({ useReceiptScannerViewModel: () => ({ selectedImage: null, isScanning: false, statusText: "", errorMessage: "The scanner returned invalid JSON.", warningMessage: null, selectImage: vi.fn(), scan: vi.fn(), reset: vi.fn() }) }));

afterEach(cleanup);

describe("ScanReceiptModal", () => {
  it("shows a scanner failure without offering to save data", () => {
    render(<ScanReceiptModal isOpen onClose={vi.fn()} onReceiptScanned={vi.fn()} />);
    expect(screen.getByText(/invalid JSON/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/invalid JSON/);
    expect(screen.getByRole("button", { name: /snap photo/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /upload image/i })).toBeTruthy();
    expect((screen.getByRole("button", { name: /scan & extract/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
