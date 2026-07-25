import React, { useState } from "react";

interface GoalsAndMoneyViewProps {
  onOpenBNPLModal: () => void;
}

export const GoalsAndMoneyView: React.FC<GoalsAndMoneyViewProps> = ({
  onOpenBNPLModal,
}) => {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "16px 20px 8px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Goals & Money</h2>
      </div>

      {/* SAVINGS GOALS SECTION */}
      <div className="section-card">
        <div className="section-header">
          <span className="hero-eyebrow" style={{ margin: 0 }}>SAVINGS GOALS</span>
          <button className="pill-btn active" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>
            + New
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-title">No goals yet</div>
          <div className="empty-sub">Set a target and start saving</div>
        </div>
      </div>

      {/* LOANS & BNPL SECTION */}
      <div className="section-card">
        <div className="section-header">
          <span className="hero-eyebrow" style={{ margin: 0 }}>LOANS & BNPL</span>
          <button className="pill-btn active" style={{ fontSize: "0.7rem", padding: "4px 10px" }} onClick={onOpenBNPLModal}>
            + New
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-title">No loans or BNPL</div>
          <div className="empty-sub">Track Atome, SPayLater, Grab, bank financing & more</div>
        </div>
      </div>

      {/* SUBSCRIPTIONS SECTION */}
      <div className="section-card">
        <div className="section-header">
          <span className="hero-eyebrow" style={{ margin: 0 }}>SUBSCRIPTIONS</span>
          <button className="pill-btn active" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>
            + Add
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-title">No subscriptions</div>
          <div className="empty-sub">Track recurring payments</div>
        </div>
      </div>
    </div>
  );
};

interface BNPLModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = ["Atome", "SPayLater", "Grab PayLater", "Boost PayFlex", "Fave"];
const TENURES = ["3 · Free", "6 mo", "12 mo"];

export const BNPLModal: React.FC<BNPLModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState("0.00");
  const [provider, setProvider] = useState("Atome");
  const [planName, setPlanName] = useState("");
  const [tenure, setTenure] = useState("3 · Free");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button className="sheet-action-btn save" onClick={onClose}>
            Add
          </button>
          <h3>Loans & BNPL</h3>
          <button className="sheet-action-btn cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        {/* Currency Hero */}
        <div style={{ textAlign: "left", margin: "10px 0 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-light)" }}>RM</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "var(--text-main)",
                width: "180px",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Segmented Option Pill */}
        <div className="segmented-pill" style={{ display: "flex", width: "100%", marginBottom: 20, padding: 4 }}>
          <button className="pill-btn active" style={{ flex: 1, padding: "8px 0", textAlign: "center" }}>
            New plan
          </button>
          <button className="pill-btn" style={{ flex: 1, padding: "8px 0", textAlign: "center" }}>
            Compare rates
          </button>
        </div>

        {/* Provider Pills */}
        <div className="hero-eyebrow" style={{ marginBottom: 8 }}>PROVIDER</div>
        <div className="pill-options-row">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              className={`opt-pill ${provider === p ? "active" : ""}`}
              onClick={() => setProvider(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-light)", marginBottom: 16 }}>
          3 splits interest-free · longer plans ~1.5%/mo · Assigned per user
        </div>

        {/* Form Card */}
        <div className="form-field-card">
          <div className="hero-eyebrow">Plan name</div>
          <input
            type="text"
            placeholder="e.g. iPhone 15 — Atome"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: "0.9rem" }}
          />

          <div className="hero-eyebrow" style={{ marginTop: 8 }}>TENURE</div>
          <div className="pill-options-row" style={{ marginBottom: 0 }}>
            {TENURES.map((t) => (
              <button
                key={t}
                className={`opt-pill ${tenure === t ? "active" : ""}`}
                onClick={() => setTenure(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="hero-eyebrow" style={{ marginTop: 8 }}>Start date</div>
          <div className="field-input-row">
            <svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ color: "#10b981", fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Dark Hero Summary Footer */}
        <div className="dark-hero-card" style={{ margin: "16px 0 0", padding: "16px 20px" }}>
          <div className="hero-stats-row">
            <div className="stat-item">
              <span className="hero-eyebrow">Monthly</span>
              <span className="stat-value">RM 0.00</span>
              <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Interest-free</span>
            </div>
            <div className="stat-item" style={{ borderLeft: "1px solid #27272a", paddingLeft: 16 }}>
              <span className="hero-eyebrow">Total · 3 mo</span>
              <span className="stat-value">RM 0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
