import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { Transaction } from "../model/types";

interface ReceiptDetailsViewProps {
  receipt: Transaction;
  onBack: () => void;
}

const SUBCATEGORY_PROPORTIONS = [
  { name: "Pantry Staples", val: 41, color: "#000000", amount: "86.41" },
  { name: "Dairy & Eggs", val: 40, color: "#cbd5e1", amount: "82.85" },
  { name: "Fruits & Vegetables", val: 11, color: "#f97316", amount: "23.90" },
  { name: "Hobbies & Toys", val: 5, color: "#ef4444", amount: "10.90" },
  { name: "Bakery & Bread", val: 2, color: "#a855f7", amount: "5.00" },
];

export const ReceiptDetailsView: React.FC<ReceiptDetailsViewProps> = ({
  receipt,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "analysis" | "image">("details");
  const [searchQuery, setSearchQuery] = useState("");

  const items = [
    {
      id: "1",
      name: "CURRY MEE",
      qty: 1.0,
      unitPrice: 19.9,
      totalPrice: 19.9,
      category: "Dining & Takeout",
      subcategory: "Restaurant",
      tags: "curry mee, noodles, malaysian food, meal",
    },
    {
      id: "2",
      name: "DRY WANTON MEE WITH CHICKEN SLIDE",
      qty: 1.0,
      unitPrice: 16.9,
      totalPrice: 16.9,
      category: "Dining & Takeout",
      subcategory: "Restaurant",
      tags: "wanton mee, chicken, noodles, malaysian food",
    },
    {
      id: "3",
      name: "BARLEY HOT",
      qty: 1.0,
      unitPrice: 5.9,
      totalPrice: 5.9,
      category: "Dining & Takeout",
      subcategory: "Restaurant",
      tags: "barley, hot drink, beverage",
    },
    {
      id: "4",
      name: "TEH TARIK",
      qty: 1.0,
      unitPrice: 4.5,
      totalPrice: 4.5,
      category: "Dining & Takeout",
      subcategory: "Restaurant",
      tags: "teh tarik, tea, beverage",
    },
  ];

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

            <table className="subtotal-table">
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    RM{(receipt.amount * (receipt.category === "Food & Dining" || receipt.category === "Shopping" ? 0.94 : 1)).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>Discounts</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>RM0.00</td>
                </tr>
                <tr>
                  <td>Service Charge</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--badge-tax-text)" }}>
                    RM{(receipt.amount * 0.04).toFixed(2)}
                  </td>
                </tr>
                {(receipt.category === "Food & Dining" || receipt.category === "Shopping") && (
                  <tr>
                    <td>Tax (6%)</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--badge-tax-text)" }}>
                      RM{(receipt.amount * 0.06).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Rounding</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>RM0.01</td>
                </tr>
                <tr className="total-row">
                  <td>Total Amount</td>
                  <td style={{ textAlign: "right" }}>RM{receipt.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
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
          {filteredItems.map((item, index) => (
            <div className="item-card" key={item.id}>
              <div className="item-card-index">{index + 1}/4</div>
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
          ))}
        </div>
      )}

      {activeTab === "analysis" && (
        <div style={{ marginTop: 16 }}>
          {/* Subcategory Proportions Card */}
          <div className="section-card">
            <div className="section-card-title">Subcategory Proportions</div>

            <div style={{ height: 220, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SUBCATEGORY_PROPORTIONS}
                    dataKey="val"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {SUBCATEGORY_PROPORTIONS.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {SUBCATEGORY_PROPORTIONS.map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 800 }}>RM{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategory Comparison Bar Chart */}
          <div className="section-card">
            <div className="section-card-title">Subcategory Comparison</div>
            <div style={{ height: 200, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBCATEGORY_PROPORTIONS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} hide />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${v}`} />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {SUBCATEGORY_PROPORTIONS.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "image" && (
        <div className="section-card" style={{ marginTop: 16, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Receipt image preview available upon receipt scan capture.
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
