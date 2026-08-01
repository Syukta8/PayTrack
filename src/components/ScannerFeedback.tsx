import React from "react";

export interface ScannerFeedbackProps {
  isScanning: boolean;
  statusText: string;
  warningMessage: string | null;
  errorMessage: string | null;
}

/** Displays scanner progress and a single actionable result message. */
export function ScannerFeedback({ isScanning, statusText, warningMessage, errorMessage }: ScannerFeedbackProps) {
  const message = errorMessage ?? warningMessage;
  if (!isScanning && !message) return null;
  const isError = Boolean(errorMessage);
  const style = isScanning
    ? { backgroundColor: "rgba(59, 130, 246, 0.08)", border: "1px solid #3b82f6", color: "#1e40af", fontWeight: 700, textAlign: "center" as const }
    : isError
      ? { backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", textAlign: "left" as const }
      : { backgroundColor: "rgba(245, 158, 11, 0.10)", border: "1px solid #fbbf24", color: "#92400e", textAlign: "left" as const };
  return <div role={isError ? "alert" : "status"} style={{ ...style, padding: "10px 12px", borderRadius: 10, fontSize: "0.78rem", marginBottom: 14 }}>
    {isScanning ? statusText : `⚠️ ${message}`}
  </div>;
}
