// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScanReceiptModal } from "./ScanReceiptModal";

const scanner = vi.hoisted(() => ({ selectedImage: null as string | null, isScanning: false, statusText: "", errorMessage: "The scanner returned invalid JSON." as string | null, warningMessage: null as string | null, selectImage: vi.fn(), scan: vi.fn(), reset: vi.fn() }));
vi.mock("../viewModels/useReceiptScannerViewModel", () => ({ useReceiptScannerViewModel: () => scanner }));

afterEach(() => { cleanup(); vi.clearAllMocks(); scanner.selectedImage = null; scanner.isScanning = false; scanner.statusText = ""; scanner.errorMessage = "The scanner returned invalid JSON."; scanner.warningMessage = null; });

describe("ScanReceiptModal", () => {
  it("shows a scanner failure without offering to save data", () => {
    render(<ScanReceiptModal isOpen onClose={vi.fn()} onReceiptScanned={vi.fn()} />);
    expect(screen.getByText(/invalid JSON/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/invalid JSON/);
    expect(screen.getByRole("button", { name: /snap photo/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /upload image/i })).toBeTruthy();
    expect((screen.getByRole("button", { name: /scan & extract/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("selects an uploaded image, starts scanning, and resets when closed", () => {
    scanner.errorMessage = null;
    render(<ScanReceiptModal isOpen onClose={vi.fn()} onReceiptScanned={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["receipt"], "receipt.jpg", { type: "image/jpeg" })] } });
    expect(scanner.selectImage).toHaveBeenCalled();
    fireEvent.click(document.querySelector(".modal-overlay") as Element);
    expect(scanner.reset).toHaveBeenCalled();
  });

  it("starts extraction only after an image is ready", () => {
    scanner.errorMessage = null;
    scanner.selectedImage = "data:image/png;base64,receipt";
    render(<ScanReceiptModal isOpen onClose={vi.fn()} onReceiptScanned={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /scan & extract/i }));
    expect(scanner.scan).toHaveBeenCalled();
  });
});
