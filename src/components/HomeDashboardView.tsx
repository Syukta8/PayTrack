import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { Transaction } from "../model/types";
import { buildDashboardMetrics } from "../model/dashboardMetrics";
import { trackingCycleForDate, trackingCycleKey } from "../model/trackingCycle";

interface HomeDashboardViewProps {
  transactions: Transaction[];
  trackingCycleStartDay?: number;
  onSelectReceipt: (receipt: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => Promise<void>;
}

const CATEGORY_COLORS = ["#3b82f6", "#2563eb", "#8b5cf6", "#f97316", "#ec4899", "#22c55e", "#06b6d4", "#a855f7"];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  transactions,
  trackingCycleStartDay = 1,
  onSelectReceipt,
  onDeleteTransaction,
}) => {
  const [activeSegment, setActiveSegment] = useState<"details" | "overview">("details");
  const [searchQuery, setSearchQuery] = useState("");

  const availableCycles = Array.from(
    new Set(transactions.map((transaction) => trackingCycleKey(transaction.date, trackingCycleStartDay)))
  ).sort().reverse();

  const [selectedCycle, setSelectedCycle] = useState<string>(() => {
    return availableCycles[0] || trackingCycleKey(new Date().toISOString().slice(0, 10), trackingCycleStartDay);
  });

  const targetCycle = availableCycles.includes(selectedCycle)
    ? selectedCycle
    : availableCycles[0] || trackingCycleKey(new Date().toISOString().slice(0, 10), trackingCycleStartDay);

  const metrics = buildDashboardMetrics(transactions, targetCycle, trackingCycleStartDay);
  const { monthTransactions, expense: totalExpense, balance: remainingBalance, tax: dynamicTax, serviceCharge: dynamicServiceCharge, rhythmTrendData, pieData, subcategoryData, firstDay: firstDayStr, lastDay: lastDayStr } = metrics;
  const cycleLabel = (cycleStart: string) => {
    const { start, end } = trackingCycleForDate(cycleStart, trackingCycleStartDay);
    const format = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    return `${format(start)} – ${format(end)}`;
  };

  const filteredTransactions = monthTransactions.filter((t) =>
    (t.description || t.category).toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div>
      {/* Pastel Gradient Header */}
      <div className="hero-gradient-header">
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <select
            value={targetCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            style={{
              appearance: "none",
              background: "#ffffff",
              border: "none",
              padding: "8px 32px 8px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-main)",
              boxShadow: "var(--shadow-sm)",
              cursor: "pointer",
            }}
          >
            {availableCycles.map((cycleStart) => {
              return (
                <option key={cycleStart} value={cycleStart}>
                  {cycleLabel(cycleStart)}
                </option>
              );
            })}
          </select>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="spending-title-row">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Remaining Balance</span>
        </div>

        <div className="total-spending-amount" style={{ color: remainingBalance < 0 ? "#ef4444" : undefined }}>
          RM{remainingBalance.toFixed(2)}
        </div>

        <div className="badge-row" style={{ flexWrap: "wrap", marginTop: 4 }}>
          <span className="badge-pill" style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#1e293b", fontSize: "0.78rem" }}>
            Total Expense: <strong style={{ color: "#ef4444" }}>RM{totalExpense.toFixed(2)}</strong>
          </span>
          {dynamicTax > 0 && <span className="badge-pill tax">Tax: RM{dynamicTax.toFixed(2)}</span>}
          {dynamicServiceCharge > 0 && (
            <span className="badge-pill service">Service Charge: RM{dynamicServiceCharge.toFixed(2)}</span>
          )}
        </div>

        <div className="date-range-sub">
          Showing data for {firstDayStr} - {lastDayStr}
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
                        <div style={{ color: "#94a3b8", fontWeight: 600 }}>Day {dataPoint.day} of this cycle</div>
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
              const itemCount = tx.items?.length ?? 0;

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
                    {itemCount > 0 && <div className="receipt-item-count">{itemCount} {itemCount === 1 ? "item" : "items"}</div>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="receipt-amount-box">
                      <div className="receipt-amount">RM{tx.amount.toFixed(2)}</div>
                      {tx.tax && tx.tax > 0 ? (
                        <div className="receipt-tax-sub">Tax: RM{tx.tax.toFixed(2)}</div>
                      ) : null}
                    </div>
                    {onDeleteTransaction && (
                      <button
                        title="Delete expense"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this expense transaction?")) {
                            void onDeleteTransaction(tx.id);
                          }
                        }}
                        style={{
                          padding: 6,
                          color: "var(--text-light)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
            {subcategoryData.length > 0 ? (
              <div style={{ height: 220, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subcategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `RM${val}`} />
                    <Tooltip formatter={(value) => `RM${Number(value).toFixed(2)}`} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {subcategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No expense subcategory data recorded.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
