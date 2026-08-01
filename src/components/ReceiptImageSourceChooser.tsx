export interface ReceiptImageSourceChooserProps {
  selectedImage: string | null;
  onChooseCamera: () => void;
  onChooseGallery: () => void;
}

/** Chooses or replaces the receipt image while keeping file-input mechanics in the modal. */
export function ReceiptImageSourceChooser({
  selectedImage,
  onChooseCamera,
  onChooseGallery,
}: ReceiptImageSourceChooserProps) {
  if (selectedImage) {
    return (
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={selectedImage}
          alt="Receipt preview"
          style={{ maxHeight: 200, borderRadius: 14, border: "1px solid var(--border-subtle)", boxShadow: "0 6px 16px rgba(0,0,0,0.08)", objectFit: "contain" }}
        />
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="pill-btn" style={{ fontSize: "0.76rem", padding: "6px 12px", fontWeight: 600 }} onClick={onChooseCamera}>📷 Retake Photo</button>
          <button className="pill-btn" style={{ fontSize: "0.76rem", padding: "6px 12px", fontWeight: 600 }} onClick={onChooseGallery}>🖼️ Upload Other File</button>
        </div>
      </div>
    );
  }

  const sourceButton = (icon: string, title: string, caption: string, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: "24px 12px", border: "2px dashed var(--border-light)", borderRadius: 16, backgroundColor: "var(--bg-subtle)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", boxShadow: "var(--shadow-sm)" }}>{icon}</div>
      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-main)" }}>{title}</span>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{caption}</span>
    </button>
  );

  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
    {sourceButton("📷", "Snap Photo", "Use camera", onChooseCamera)}
    {sourceButton("🖼️", "Upload Image", "Choose from gallery", onChooseGallery)}
  </div>;
}
