import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./model/AuthContext";
import { useTrackerViewModel } from "./viewModels/useTrackerViewModel";

import { BottomNav } from "./components/BottomNav";
import type { NavTab } from "./components/BottomNav";
import { QuickActionsModal } from "./components/QuickActionsModal";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { GoalsAndMoneyView, BNPLModal } from "./components/GoalsAndMoneyView";

const currency = (value: number): string =>
  `RM${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function App() {
  const { user, loading: authLoading, sheetsAccessToken, configurationError, signIn, signOut } = useAuth();
  const vm = useTrackerViewModel(sheetsAccessToken);

  // Navigation and Modal UI State
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isBNPLOpen, setIsBNPLOpen] = useState(false);

  // Existing auth form state
  const [sheetLink, setSheetLink] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function connect(event: FormEvent) {
    event.preventDefault();
    setInitializing(true);
    setActionError(null);
    try {
      await vm.connect(sheetLink, true);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to connect sheet.");
    } finally {
      setInitializing(false);
    }
  }

  async function run(action: () => Promise<void>, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    setActionError(null);
    try {
      await action();
      await vm.reload();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Action failed.");
    }
  }

  if (authLoading) return <main style={{ padding: 20 }}>Loading…</main>;

  if (configurationError && !vm.isDemo) {
    return (
      <main className="auth">
        <h1>Configure Firebase first</h1>
        <p>{configurationError}</p>
      </main>
    );
  }

  if (!user && !vm.isDemo) {
    return (
      <main className="auth">
        <h1>PayTrack</h1>
        <p>Your private Google Sheet is your database.</p>
        <button onClick={() => void signIn()}>Sign in with Google</button>
      </main>
    );
  }

  if (!sheetsAccessToken && !vm.isDemo) {
    return (
      <main className="auth">
        <h1>Sheets access needed</h1>
        <p>Sign in again and approve Google Sheets access to connect your private workbook.</p>
        <button onClick={() => void signIn()}>Grant Sheets access</button>
        <button className="secondary" onClick={() => void signOut()}>Sign out</button>
      </main>
    );
  }

  if (!vm.spreadsheetId && !vm.isDemo) {
    return (
      <main className="auth">
        <h1>Connect your private Sheet</h1>
        <p>Create a blank Google Sheet owned by {user?.email}, paste its link below, then initialize its PayTrack tabs.</p>
        <form onSubmit={connect}>
          <input
            aria-label="Google Sheets link"
            value={sheetLink}
            onChange={(event) => setSheetLink(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            required
          />
          <button disabled={initializing}>{initializing ? "Initializing…" : "Connect and initialize"}</button>
        </form>
        {actionError && <p className="error">{actionError}</p>}
      </main>
    );
  }

  const data = vm.data;
  const netSavings = data ? data.dashboard.netAmount : 0;
  const totalIncome = data ? data.dashboard.totalIncome : 0;
  const totalExpense = data ? data.dashboard.totalExpense : 0;
  const transactionCount = data ? data.transactions.length : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const handleAddTransactionSubmit = async (formData: {
    type: "expense" | "income";
    amount: number;
    category: string;
    paymentMethod: string;
    date: string;
    note: string;
  }) => {
    if (!vm.tracker) return;
    await run(async () => {
      await vm.tracker?.addTransaction({
        date: formData.date,
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        paymentType: formData.paymentMethod,
        description: formData.note,
        remarks: "",
      });
    });
  };

  return (
    <div className="app-viewport">
      <div className="app-container">
        {/* Top Navigation Bar Header */}
        <header className="app-header">
          <div className="user-greeting">
            <span className="greeting-label">Good morning</span>
            <span className="user-name">{user?.displayName || user?.email?.split("@")[0] || "MUHAMMAD"}</span>
          </div>

          <div className="header-right">
            <button className="icon-circle-btn" aria-label="Notifications">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Tab Views */}
        {activeTab === "home" && (
          <main style={{ padding: 0 }}>
            {/* Dark Net Savings Hero Card (Image 1) */}
            <div className="dark-hero-card">
              <div className="hero-eyebrow">JULY 2026 · NET SAVINGS</div>
              <div className="hero-amount">
                {netSavings >= 0 ? "+" : "−"}
                {currency(Math.abs(netSavings))}
              </div>

              <div className="hero-divider" />

              <div className="hero-stats-row">
                <div className="stat-item">
                  <div className="stat-label-dot">
                    <span className="dot green" />
                    <span>INCOME</span>
                  </div>
                  <span className="stat-value">{currency(totalIncome)}</span>
                </div>

                <div className="stat-item">
                  <div className="stat-label-dot">
                    <span className="dot red" />
                    <span>EXPENSE</span>
                  </div>
                  <span className="stat-value">{currency(totalExpense)}</span>
                </div>
              </div>
            </div>

            {/* 2-Column Stat Cards */}
            <div className="stats-two-grid">
              <div className="white-stat-card">
                <span className="eyebrow">TRANSACTIONS</span>
                <span className="value">{transactionCount}</span>
              </div>
              <div className="white-stat-card">
                <span className="eyebrow">SAVINGS RATE</span>
                <span className="value">{savingsRate}%</span>
              </div>
            </div>

            {/* Recent Section Card */}
            <div className="section-card">
              <div className="section-header">
                <h3>Recent</h3>
                <button className="see-all-btn" onClick={() => setActiveTab("log")}>
                  See all
                </button>
              </div>

              {data && data.transactions.length > 0 ? (
                <div>
                  {data.transactions.slice(0, 4).map((tx) => (
                    <div className="entry-row" key={tx.id}>
                      <div>
                        <strong>{tx.description || tx.category}</strong>
                        <small style={{ display: "block", color: "var(--text-light)", fontSize: "0.75rem" }}>
                          {tx.category} · {tx.date}
                        </small>
                      </div>
                      <b style={{ color: tx.type === "income" ? "var(--accent-green)" : "var(--text-main)" }}>
                        {tx.type === "income" ? "+" : "−"}
                        {currency(tx.amount)}
                      </b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-title">No transactions yet</div>
                  <div className="empty-sub">Tap + to add your first one</div>
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === "log" && (
          <main style={{ padding: "0 20px 20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "16px 0" }}>Transactions Log</h2>
            <div className="section-card" style={{ margin: 0 }}>
              {data && data.transactions.length > 0 ? (
                data.transactions.map((tx) => (
                  <div className="entry-row" key={tx.id}>
                    <div>
                      <strong>{tx.description || tx.category}</strong>
                      <small style={{ display: "block", color: "var(--text-light)", fontSize: "0.75rem" }}>
                        {tx.category} · {tx.paymentType || "Cash"} · {tx.date}
                      </small>
                    </div>
                    <b style={{ color: tx.type === "income" ? "var(--accent-green)" : "var(--text-main)" }}>
                      {tx.type === "income" ? "+" : "−"}
                      {currency(tx.amount)}
                    </b>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-title">No logged transactions</div>
                  <div className="empty-sub">Add transactions using the central + button</div>
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === "goals" && (
          <GoalsAndMoneyView onOpenBNPLModal={() => setIsBNPLOpen(true)} />
        )}

        {activeTab === "more" && (
          <main style={{ padding: "0 20px 20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "16px 0" }}>More Options</h2>
            <div className="section-card" style={{ margin: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Signed in as: <strong>{user?.email || "Demo User"}</strong>
                </div>
                {!vm.isDemo && (
                  <button
                    className="pill-btn active"
                    style={{ padding: "10px 16px", textAlign: "center" }}
                    onClick={() => void signOut()}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Floating Bottom Nav Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFabClick={() => setIsQuickActionsOpen(true)}
        />

        {/* Modals & Bottom Drawers */}
        <QuickActionsModal
          isOpen={isQuickActionsOpen}
          onClose={() => setIsQuickActionsOpen(false)}
          onOpenAddTransaction={() => setIsAddExpenseOpen(true)}
          onOpenSetBudget={() => alert("Set Budget modal option chosen")}
          onOpenBNPLModal={() => setIsBNPLOpen(true)}
        />

        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onSubmit={handleAddTransactionSubmit}
        />

        <BNPLModal
          isOpen={isBNPLOpen}
          onClose={() => setIsBNPLOpen(false)}
        />
      </div>
    </div>
  );
}
