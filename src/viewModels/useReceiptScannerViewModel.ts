import { useCallback, useState } from "react";
import { MIN_LEGIBLE_WIDTH, measureWidth, prepareImage } from "../model/receiptImage";
import { scanReceipt } from "../model/receiptVision";
import type { ReceiptItem } from "../model/types";

const API_KEY_STORAGE = "paytrack.geminiApiKey";

export interface ScannedTransactionDraft {
  amount: number;
  tax?: number;
  serviceCharge?: number;
  category: string;
  description: string;
  date: string;
  note: string;
  imageUrl?: string;
  driveUrl?: string;
  paymentMethod?: string;
  items?: ReceiptItem[];
}

/** Owns the receipt-scanning workflow: image selection, preparation, extraction and the
 * user-facing status of each. The View renders this state and raises intents. */
export function useReceiptScannerViewModel(onScanned: (draft: ScannedTransactionDraft) => void) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSelectedImage(null);
    setErrorMessage(null);
    setWarningMessage(null);
    setIsScanning(false);
    setStatusText("");
  }, []);

  const selectImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      setErrorMessage(null);
      const width = await measureWidth(dataUrl);
      setWarningMessage(
        width > 0 && width < MIN_LEGIBLE_WIDTH
          ? `This photo is only ${width}px wide. Receipt text below ${MIN_LEGIBLE_WIDTH}px often reads incorrectly — consider retaking it closer or in better light.`
          : null,
      );
    };
    reader.onerror = () => setErrorMessage("That file could not be read. Please choose a photo of the receipt.");
    reader.readAsDataURL(file);
  }, []);

  const scan = useCallback(async () => {
    if (!selectedImage) {
      setErrorMessage("Please snap a photo or upload a receipt image first.");
      return;
    }

    const apiKey = localStorage.getItem(API_KEY_STORAGE)?.trim();
    if (!apiKey) {
      setErrorMessage(
        "Scanner not configured: no Gemini API key is set, so this receipt cannot be read. Add your key to continue, or close this and enter the expense manually.",
      );
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setStatusText("⚡ Preparing receipt image...");

    try {
      const prepared = await prepareImage(selectedImage);
      const base64Data = prepared.dataUrl.split(",")[1];
      const mimeType = prepared.dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
      if (!base64Data) {
        setErrorMessage("That file could not be read as an image. Please choose a photo of the receipt.");
        return;
      }

      setStatusText("🤖 Reading receipt with AI Vision...");
      const outcome = await scanReceipt({ apiKey, base64Data, mimeType });
      if (!outcome.ok) {
        setErrorMessage(outcome.reason);
        return;
      }

      const { receipt } = outcome;
      const stamp = Date.now().toString(36);
      const driveFolder = `PayTrack_Receipts/${receipt.date.slice(0, 4)}/${receipt.date.slice(5, 7)}/rcpt_${stamp}.jpg`;

      onScanned({
        amount: receipt.totalAmount,
        tax: receipt.tax,
        serviceCharge: receipt.serviceCharge,
        category: receipt.category,
        description: receipt.merchantName,
        date: receipt.date,
        note: receipt.note,
        paymentMethod: receipt.paymentMethod,
        imageUrl: prepared.dataUrl,
        driveUrl: `Google Drive: ${driveFolder}`,
        items: receipt.items.map((item, index) => ({
          id: `item_${stamp}_${index}`,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category ?? receipt.category,
        })),
      });
      reset();
    } finally {
      setIsScanning(false);
      setStatusText("");
    }
  }, [onScanned, reset, selectedImage]);

  return { selectedImage, isScanning, statusText, errorMessage, warningMessage, selectImage, scan, reset };
}
