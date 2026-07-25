import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { Transaction } from "../model/types";

interface HomeDashboardViewProps {
  transactions: Transaction[];
  onSelectReceipt: (receipt: Transaction) => void;
}

const CATEGORY_COLORS = ["#3b82f6", "#2563eb", "#8b5cf6", "#f97316", "#ec4899", "#22c55e"];
const SUBCATEGORY_DATA = [
  { name: "Dairy & Eggs", amount: 92, fill: "#a855f7" },
  { name: "Restaurant", amount: 68, fill: "#f97316" },
  { name: "Fruits & Vegetables", amount: 32, fill: "#ec4899" },
  { name: "Fast Food", amount: 24, fill: "#06b6d4" },
  { name: "Beverages", amount: 18, fill: "#78350f" },
];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  transactions,
  onSelectReceipt,
}) => {
  const [activeSegment, setActiveSegment] = useState<"details" | "overview">("details");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter((t) =>
    (t.description || t.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Mock rhythm line data matching reference curve
  const rhythmTrendData = [
    { day: 1, val: 20 },
    { day: 5, val: 90 },
    { day: 9, val: 240 },
    { day: 13, val: 40 },
    { day: 17, val: 80 },
  ];

  // Spending by category distribution for Pie Chart
  const categoryMap = new Map<string, number>();
  transactions.forEach((t) => {
    if (t.type === "expense") {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    }
  });

  const pieData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  if (pieData.length === 0) {
    pieData.push(
      { name: "Groceries", value: 57.1 },
      { name: "Dining & Takeout", value: 38.0 }
    );
  }

  return (
    <div>
      {/* Pastel Gradient Header */}
      <div className="hero-gradient-header">
        <button className="month-dropdown-btn">
          <span>This Month</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="spending-title-row">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Total Spending</span>
        </div>

        <div className="total-spending-amount">
          RM{totalExpense.toFixed(2)}
        </div>

        <div className="badge-row">
          <span className="badge-pill tax">Tax: RM5.49</span>
          <span className="badge-pill service">Service Charge: RM6.16</span>
        </div>

        <div className="date-range-sub">
          Showing data for 01 Oct - 17 Oct
        </div>

        {/* Smooth Curved Line Graph */}
        <div style={{ height: 160, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rhythmTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientCurve" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: "0.75rem",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        <div style={{ color: "#94a3b8", fontWeight: 600 }}>Day {dataPoint.day} Oct 2026</div>
                        <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>
                          RM{Number(dataPoint.val).toFixed(2)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="val"
                stroke="#2563eb"
                strokeWidth={4}
                fill="url(#gradientCurve)"
                activeDot={{ r: 7, fill: "#ffffff", stroke: "#2563eb", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segmented Control Pills */}
      <div className="segmented-tab-container">
        <button
          className={`segmented-tab-btn ${activeSegment === "details" ? "active" : ""}`}
          onClick={() => setActiveSegment("details")}
        >
          Details
        </button>
        <button
          className={`segmented-tab-btn ${activeSegment === "overview" ? "active" : ""}`}
          onClick={() => setActiveSegment("overview")}
        >
          Overview
        </button>
      </div>

      {/* Segmented Content */}
      {activeSegment === "details" ? (
        <div className="section-card">
          <div className="section-card-title">Recent Receipts</div>
          
          {/* Integrated Search Box */}
          <div className="search-box-card" style={{ margin: "12px 0 16px" }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by store or item name"
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

          <div className="section-card-sub">
            Showing {filteredTransactions.length} out of {transactions.length} results
          </div>

          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isEligibleCategory =
                tx.category === "Food & Dining" ||
                tx.category === "Shopping" ||
                tx.category === "Entertainment";
              const isTaxableCategory =
                tx.category === "Food & Dining" || tx.category === "Shopping";

              return (
                <div
                  className="receipt-row"
                  key={tx.id}
                  onClick={() => {
                    if (isEligibleCategory) {
                      onSelectReceipt(tx);
                    }
                  }}
                  style={{ cursor: isEligibleCategory ? "pointer" : "default" }}
                >
                  <div>
                    <div className="receipt-date">{tx.date}</div>
                    <div className="receipt-title">{tx.description || tx.category}</div>
                    {isEligibleCategory && <div className="receipt-item-count">4 items</div>}
                  </div>

                  <div className="receipt-amount-box">
                    <div className="receipt-amount">RM{tx.amount.toFixed(2)}</div>
                    {isTaxableCategory && (
                      <div className="receipt-tax-sub">RM{(tx.amount * 0.06).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
              No recent receipts recorded.
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Spending by Category Donut Chart */}
          <div className="section-card">
            <div className="section-card-title">Spending by Category</div>

            <div style={{ height: 200, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `RM${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
              {pieData.map((item, idx) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                    }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spending by Subcategory Bar Chart */}
          <div className="section-card">
            <div className="section-card-title">Spending by Subcategory</div>
            <div style={{ height: 220, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBCATEGORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <XAxis dataKey="name" interval={0} angle={-90} textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `RM${val}`} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {SUBCATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
