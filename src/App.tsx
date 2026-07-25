import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./model/AuthContext";
import { useTrackerViewModel } from "./viewModels/useTrackerViewModel";

import { BottomNav } from "./components/BottomNav";
import type { NavTab } from "./components/BottomNav";
import { HomeDashboardView } from "./components/HomeDashboardView";
import { ReceiptDetailsView } from "./components/ReceiptDetailsView";
import { AddExpenseModal } from "./components/AddExpenseModal";
import type { Transaction } from "./model/types";

type ThemeMode = "light" | "dark" | "system";

export default function App() {
  const { user, loading: authLoading, sheetsAccessToken, configurationError, signIn, signOut } = useAuth();
  const vm = useTrackerViewModel(sheetsAccessToken);

  // Navigation, Selection, Modal, and Theme state
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("paytrack.theme") as ThemeMode) || "system";
  });

  // Auth connection state
  const [sheetLink, setSheetLink] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Handle Theme switching (Light / Dark / System)
  useEffect(() => {
    localStorage.setItem("paytrack.theme", themeMode);
    const applyTheme = (mode: ThemeMode) => {
      let resolvedTheme = mode;
      if (mode === "system") {
        resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      if (resolvedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };

    applyTheme(themeMode);

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

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

  const handleTabChange = (tab: NavTab) => {
    if (tab === "add") {
      setIsAddModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleAddTransactionSubmit = async (formData: {
    type: "expense" | "income";
    amount: number;
    category: string;
    paymentMethod: string;
    date: string;
    note: string;
  }) => {
    if (!vm.tracker) return;
    try {
      await vm.tracker.addTransaction({
        date: formData.date,
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        paymentType: formData.paymentMethod,
        description: formData.note,
        remarks: "",
      });
      await vm.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add transaction.");
    }
  };

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

  const transactions = vm.data ? vm.data.transactions : [];

  return (
    <div className="app-viewport">
      <div className="app-container">
        {selectedReceipt ? (
          <ReceiptDetailsView
            receipt={selectedReceipt}
            onBack={() => setSelectedReceipt(null)}
          />
        ) : (
          <>
            {activeTab === "home" && (
              <HomeDashboardView
                transactions={transactions}
                onSelectReceipt={setSelectedReceipt}
              />
            )}

            {activeTab === "search" && (
              <main style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 12 }}>Search Receipts</h2>
                <div className="search-box-card" style={{ margin: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search by store or item name" />
                </div>
              </main>
            )}

            {activeTab === "scan" && (
              <main style={{ padding: "20px", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 12 }}>Scan Receipt</h2>
                <div className="section-card" style={{ padding: 40, margin: 0 }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: "0 auto 16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <button className="primary-dark-btn">Upload or Capture Receipt</button>
                </div>
              </main>
            )}

            {activeTab === "settings" && (
              <main style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 16 }}>Settings</h2>

                {/* Theme Mode Switch Card */}
                <div className="section-card" style={{ margin: "0 0 16px" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>Appearance / Theme</div>
                  <div className="segmented-tab-container" style={{ margin: 0 }}>
                    <button
                      className={`segmented-tab-btn ${themeMode === "light" ? "active" : ""}`}
                      onClick={() => setThemeMode("light")}
                    >
                      Light
                    </button>
                    <button
                      className={`segmented-tab-btn ${themeMode === "dark" ? "active" : ""}`}
                      onClick={() => setThemeMode("dark")}
                    >
                      Dark
                    </button>
                    <button
                      className={`segmented-tab-btn ${themeMode === "system" ? "active" : ""}`}
                      onClick={() => setThemeMode("system")}
                    >
                      System
                    </button>
                  </div>
                </div>

                {/* Account Actions Card */}
                <div className="section-card" style={{ margin: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Account: <strong>{user?.email || "Demo User"}</strong>
                    </div>
                    {!vm.isDemo && (
                      <button className="primary-dark-btn" onClick={() => void signOut()}>
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </main>
            )}

            <BottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {/* Manual Add Expense Modal */}
            <AddExpenseModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSubmit={handleAddTransactionSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}
