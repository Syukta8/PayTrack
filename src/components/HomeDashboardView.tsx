import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { Transaction } from "../model/types";

interface HomeDashboardViewProps {
  transactions: Transaction[];
  onSelectReceipt: (receipt: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => Promise<void>;
}

const CATEGORY_COLORS = ["#3b82f6", "#2563eb", "#8b5cf6", "#f97316", "#ec4899", "#22c55e", "#06b6d4", "#a855f7"];
const BAR_COLORS = ["#a855f7", "#f97316", "#ec4899", "#06b6d4", "#78350f", "#3b82f6", "#10b981"];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  transactions,
  onSelectReceipt,
  onDeleteTransaction,
}) => {
  const [activeSegment, setActiveSegment] = useState<"details" | "overview">("details");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter((t) =>
    (t.description || t.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate Salary Income (Main Income)
  const salaryIncome = transactions
    .filter((t) => t.type === "income" || t.category === "Salary")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate Total Expense (All non-salary expenses & allocations)
  const totalExpense = transactions
    .filter((t) => t.type === "expense" || t.category !== "Salary")
    .reduce((sum, t) => sum + t.amount, 0);

  // Remaining Balance = Salary Income - Total Expense
  const remainingBalance = salaryIncome - totalExpense;

  // Calculate dynamic timeline for AreaChart based on transactions date range or current month
  let targetYearMonth = new Date().toISOString().slice(0, 7);
  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).filter(Boolean).sort();
    if (dates.length > 0) {
      targetYearMonth = dates[dates.length - 1].slice(0, 7); // Use latest transaction month
    }
  }

  const [yearStr, monthStr] = targetYearMonth.split("-");
  const yearNum = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString("en-US", { month: "short" });

  const rhythmTrendMap = new Map<number, number>();
  let dynamicTax = 0;
  let dynamicServiceCharge = 0;

  // Dynamic distribution maps
  const categoryMap = new Map<string, number>();
  const subcategoryMap = new Map<string, number>();

  transactions.forEach((t) => {
    const isExpenseItem = t.type === "expense" || t.category !== "Salary";
    if (isExpenseItem) {
      // Category totals
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);

      // Subcategory / Description totals (Restricted strictly to Food & Dining, Shopping, and Entertainment)
      if (
        t.category === "Food & Dining" ||
        t.category === "Shopping" ||
        t.category === "Entertainment"
      ) {
        const subName = t.description || t.category;
        subcategoryMap.set(subName, (subcategoryMap.get(subName) || 0) + t.amount);
      }

      // Dynamic Tax (6% for Food & Dining or Shopping)
      if (t.category === "Food & Dining" || t.category === "Shopping") {
        dynamicTax += t.amount * 0.06;
      }
      // Dynamic Service Charge (4% for Food & Dining)
      if (t.category === "Food & Dining") {
        dynamicServiceCharge += t.amount * 0.04;
      }

      if (t.date.startsWith(targetYearMonth)) {
        const day = parseInt(t.date.slice(-2), 10);
        if (!isNaN(day)) {
          rhythmTrendMap.set(day, (rhythmTrendMap.get(day) || 0) + t.amount);
        }
      }
    }
  });

  const rhythmTrendData = Array.from({ length: totalDaysInMonth }, (_, index) => {
    const dayNum = index + 1;
    return {
      day: dayNum,
      val: rhythmTrendMap.get(dayNum) || 0,
    };
  });

  // Dynamic Pie Chart Data from actual Google Sheet categories
  const pieData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Dynamic Bar Chart Data from actual Google Sheet subcategories/items
  const subcategoryData = Array.from(subcategoryMap.entries()).map(([name, amount], idx) => ({
    name,
    amount,
    fill: BAR_COLORS[idx % BAR_COLORS.length],
  }));

  const firstDayStr = `${targetYearMonth}-01`;
  const lastDayStr = `${targetYearMonth}-${String(totalDaysInMonth).padStart(2, "0")}`;

  return (
    <div>
      {/* Pastel Gradient Header */}
      <div className="hero-gradient-header">
        <button className="month-dropdown-btn">
          <span>This Month ({monthName} {yearNum})</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

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
          <span className="badge-pill tax">Tax: RM{dynamicTax.toFixed(2)}</span>
          <span className="badge-pill service">Service Charge: RM{dynamicServiceCharge.toFixed(2)}</span>
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
                        <div style={{ color: "#94a3b8", fontWeight: 600 }}>Day {dataPoint.day} {monthName} {yearNum}</div>
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

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="receipt-amount-box">
                      <div className="receipt-amount">RM{tx.amount.toFixed(2)}</div>
                      {isTaxableCategory && (
                        <div className="receipt-tax-sub">RM{(tx.amount * 0.06).toFixed(2)}</div>
                      )}
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
