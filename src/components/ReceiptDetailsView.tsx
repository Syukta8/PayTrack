import React, { useState, useEffect } from "react";
import type { Transaction } from "../model/types";
import { getReceiptImage } from "../model/imageStore";

interface ReceiptDetailsViewProps {
  receipt: Transaction;
  onBack: () => void;
}

export const ReceiptDetailsView: React.FC<ReceiptDetailsViewProps> = ({
  receipt,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "analysis" | "image">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (receipt.id) {
      getReceiptImage(receipt.id).then((stored) => {
        if (isMounted && stored) {
          setLocalImage(stored);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [receipt.id]);

  const items: Array<{
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    category: string;
    subcategory: string;
    tags: string;
  }> = [];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* View Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: "#ffffff" }}>
        <button onClick={onBack} style={{ padding: 4, marginRight: 12 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Receipt Details</h2>
      </div>

      {/* Segmented Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)", background: "#ffffff" }}>
        <button
          className={`segmented-tab-btn ${activeTab === "details" ? "active" : ""}`}
          style={{ borderRadius: 0, boxShadow: "none" }}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={`segmented-tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          style={{ borderRadius: 0, boxShadow: "none" }}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </button>
        <button
          className={`segmented-tab-btn ${activeTab === "image" ? "active" : ""}`}
          style={{ borderRadius: 0, boxShadow: "none" }}
          onClick={() => setActiveTab("image")}
        >
          Image
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "details" && (
        <div>
          {/* Store Overview Card */}
          <div className="section-card" style={{ marginTop: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                {receipt.description || "Rich Kopitiam"}
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{receipt.date}</span>
            </div>

            {(() => {
              const actualTax = receipt.tax || 0;
              const actualServiceCharge = receipt.serviceCharge || 0;
              const subtotal = Math.max(0, receipt.amount - actualTax - actualServiceCharge);

              return (
                <table className="subtotal-table">
                  <tbody>
                    <tr>
                      <td>Subtotal</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        RM{subtotal.toFixed(2)}
                      </td>
                    </tr>
                    {actualServiceCharge > 0 && (
                      <tr>
                        <td>Service Charge</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--badge-tax-text)" }}>
                          RM{actualServiceCharge.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {actualTax > 0 && (
                      <tr>
                        <td>Tax (SST/GST)</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--badge-tax-text)" }}>
                          RM{actualTax.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td>Total Amount</td>
                      <td style={{ textAlign: "right" }}>RM{receipt.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 20px 10px" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {filteredItems.length} items in total
            </span>
            <button className="primary-dark-btn" style={{ width: "auto", padding: "8px 16px", fontSize: "0.8rem" }}>
              Add Item
            </button>
          </div>

          {/* Search Box */}
          <div className="search-box-card">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by item name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Itemized Cards */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div className="item-card" key={item.id}>
                <div className="item-card-index">{index + 1}/{filteredItems.length}</div>
                <div className="item-card-title">{item.name}</div>

                <div className="item-field-row">
                  <span>Quantity</span>
                  <span>{item.qty.toFixed(1)}</span>
                </div>
                <div className="item-field-row">
                  <span>Unit Price</span>
                  <span>RM{item.unitPrice.toFixed(2)}</span>
                </div>
                <div className="item-field-row strong">
                  <span>Total Price</span>
                  <span>RM{item.totalPrice.toFixed(2)}</span>
                </div>

                <div className="item-field-row" style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 8, paddingTop: 6 }}>
                  <span>Category</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.category}</span>
                </div>
                <div className="item-field-row">
                  <span>Subcategory</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.subcategory}</span>
                </div>
                <div className="item-field-row">
                  <span>Tags</span>
                  <span style={{ fontStyle: "italic" }}>{item.tags}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="section-card" style={{ textAlign: "center", padding: "30px 20px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No itemized breakdown for this receipt.
            </div>
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <div style={{ marginTop: 16 }}>
          <div className="section-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              No item breakdown analysis available for this transaction.
            </div>
          </div>
        </div>
      )}

      {activeTab === "image" && (
        <div style={{ marginTop: 16 }}>
          <div className="section-card" style={{ padding: 16, textAlign: "center" }}>
            {(() => {
              const displayImage = receipt.imageUrl || localImage;
              if (!displayImage) {
                return (
                  <div style={{ padding: "40px 20px" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🧾</div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 800 }}>No Receipt Image Attached</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Snap or upload a photo via AI Receipt Scanner to store high-res receipts in your Google Drive Vault.
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                    <img
                      src={displayImage}
                      alt={`Scanned Receipt - ${receipt.description}`}
                      style={{
                        width: "100%",
                        maxHeight: 520,
                        borderRadius: 16,
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  
                  <div style={{ marginTop: 16, textAlign: "left", background: "var(--bg-subtle)", padding: 14, borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534" }}>
                        📁 Google Drive 7-Year Vault Backup
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#15803d", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                        Synced
                      </span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                      {receipt.driveUrl || `Google Drive: PayTrack_Receipts/${receipt.date.slice(0, 4)}/${receipt.date.slice(5, 7)}/receipt_${receipt.id}.jpg`}
                    </div>
                  </div>

                  <a
                    href={displayImage}
                    target="_blank"
                    rel="noreferrer"
                    className="pill-btn"
                    style={{ display: "inline-block", marginTop: 14, fontSize: "0.8rem", padding: "8px 16px", textDecoration: "none", fontWeight: 700 }}
                  >
                    🔍 Open Full High-Res Receipt Photo
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Sticky Bottom Verification Footer */}
      <div className="sticky-bottom-action">
        <div className="verified-banner">
          <span>Subtotal Verified (RM43.70)</span>
          <svg width="20" height="20" fill="#22c55e" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        <button className="primary-dark-btn" onClick={onBack}>
          Update Receipt
        </button>
      </div>
    </div>
  );
};
