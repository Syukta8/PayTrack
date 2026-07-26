import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./model/AuthContext";
import { useTrackerViewModel } from "./viewModels/useTrackerViewModel";

import { BottomNav } from "./components/BottomNav";
import type { NavTab } from "./components/BottomNav";
import { HomeDashboardView } from "./components/HomeDashboardView";
import { ReceiptDetailsView } from "./components/ReceiptDetailsView";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { QuickActionsModal } from "./components/QuickActionsModal";
import { BillsView } from "./components/BillsView";
import { MaintenanceView } from "./components/MaintenanceView";
import { ScanReceiptModal } from "./components/ScanReceiptModal";
import { PasteSmsModal } from "./components/PasteSmsModal";
import { StatementReconciliationModal } from "./components/StatementReconciliationModal";
import { saveReceiptImage } from "./model/imageStore";
import type { Transaction, ReceiptItem } from "./model/types";

type ThemeMode = "light" | "dark" | "system";

export default function App() {
  const { user, loading: authLoading, sheetsAccessToken, configurationError, signIn, signOut } = useAuth();
  const vm = useTrackerViewModel(sheetsAccessToken);

  // Navigation, Selection, Modal, and Theme state
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isPasteSmsOpen, setIsPasteSmsOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [scannedData, setScannedData] = useState<{
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    note?: string;
    imageUrl?: string;
    driveUrl?: string;
    paymentMethod?: string;
    tax?: number;
    serviceCharge?: number;
    items?: ReceiptItem[];
  } | null>(null);
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

  const handleAddTransactionSubmit = async (formData: {
    type: "expense" | "income";
    amount: number;
    category: string;
    paymentMethod: string;
    date: string;
    note: string;
    imageUrl?: string;
    driveUrl?: string;
    tax?: number;
    serviceCharge?: number;
    items?: ReceiptItem[];
  }) => {
    if (!vm.tracker) return;
    try {
      const drivePath = formData.driveUrl || scannedData?.driveUrl || `Google Drive: PayTrack_Receipts/${formData.date.slice(0, 4)}/${formData.date.slice(5, 7)}/receipt_${Date.now().toString(36)}.jpg`;
      const imgData = formData.imageUrl || scannedData?.imageUrl;
      const subitems = formData.items || scannedData?.items;

      // Line items live in their own sheet tab now, so they are no longer packed into
      // remarks (where anything past ~500 characters was silently dropped).
      const createdId = await vm.tracker.addTransaction({
        date: formData.date,
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        paymentType: formData.paymentMethod,
        description: formData.note,
        remarks: drivePath,
        imageUrl: drivePath,
        driveUrl: drivePath,
        tax: formData.tax ?? scannedData?.tax ?? 0,
        serviceCharge: formData.serviceCharge ?? scannedData?.serviceCharge ?? 0,
        items: subitems,
      });

      // IndexedDB is now an image-only cache; the line items were written to the sheet above.
      if (createdId && imgData) {
        await saveReceiptImage(createdId, imgData);
      }
      await vm.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add transaction.");
    }
  };

  if (authLoading) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)" }}>Loading PayTrack…</div>
      </div>
    );
  }

  if (configurationError && !vm.isDemo) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="section-card" style={{ maxWidth: 460, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚙️</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 8 }}>Configure Firebase First</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 20 }}>
            {configurationError}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !vm.isDemo) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="section-card" style={{ maxWidth: 440, padding: 36, textAlign: "center", width: "90%" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>💰</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Welcome to PayTrack</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Your private Google Sheet is your database. Sign in to sync and track all your income and expenses securely.
          </p>
          <button className="primary-dark-btn" onClick={() => void signIn()}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!sheetsAccessToken && !vm.isDemo) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="section-card" style={{ maxWidth: 460, padding: 36, textAlign: "center", width: "90%" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--badge-tax-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" fill="none" stroke="var(--badge-tax-text)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Sheets Access Needed</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Sign in again and grant permission to connect your private Google Sheets database to PayTrack.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="primary-dark-btn" onClick={() => void signIn()}>
              Grant Sheets Access
            </button>
            <button className="pill-btn" style={{ padding: "12px", textAlign: "center" }} onClick={() => void signOut()}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!vm.spreadsheetId && !vm.isDemo) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="section-card" style={{ maxWidth: 460, padding: 36, width: "90%" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📊</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Connect Your Google Sheet</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Create a blank Google Sheet owned by <strong>{user?.email}</strong>, paste its link below, then initialize.
            </p>
          </div>

          <form onSubmit={connect} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="search-box-card" style={{ margin: 0 }}>
              <input
                aria-label="Google Sheets link"
                value={sheetLink}
                onChange={(event) => setSheetLink(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                required
              />
            </div>
            <button className="primary-dark-btn" disabled={initializing}>
              {initializing ? "Connecting & Initializing…" : "Connect and Initialize"}
            </button>
          </form>
          {actionError && (
            <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 12, textAlign: "center" }}>
              {actionError}
            </div>
          )}
        </div>
      </div>
    );
  }

  const transactions = vm.data ? vm.data.transactions : [];
  const bills = vm.data ? vm.data.bills : [];
  const maintenance = vm.data ? vm.data.maintenance : [];
  const carInfo = vm.data ? vm.data.carInfo : { id: "", currentMileage: 0, updatedAt: "" };

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
                onDeleteTransaction={async (transactionId) => {
                  if (!vm.tracker) return;
                  await vm.tracker.deleteTransaction(transactionId);
                  await vm.reload();
                }}
              />
            )}

            {activeTab === "bills" && (
              <BillsView
                bills={bills}
                transactions={transactions}
                onMarkPaid={async (billId) => {
                  if (!vm.tracker) return;
                  await vm.tracker.markBillPaid(billId);
                  await vm.reload();
                }}
                onAddBill={async (billInput) => {
                  if (!vm.tracker) return;
                  await vm.tracker.addBill(billInput);
                  await vm.reload();
                }}
                onUpdateBill={async (billId, billInput) => {
                  if (!vm.tracker) return;
                  await vm.tracker.updateBill(billId, billInput);
                  await vm.reload();
                }}
                onDeleteBill={async (billId) => {
                  if (!vm.tracker) return;
                  await vm.tracker.deleteBill(billId);
                  await vm.reload();
                }}
              />
            )}

            {activeTab === "maintenance" && (
              <MaintenanceView
                maintenance={maintenance}
                carInfo={carInfo}
                onSetMileage={async (mileage) => {
                  if (!vm.tracker) return;
                  await vm.tracker.setMileage(mileage);
                  await vm.reload();
                }}
                onAddMaintenance={async (itemInput) => {
                  if (!vm.tracker) return;
                  await vm.tracker.addMaintenance(itemInput);
                  await vm.reload();
                }}
                onMarkDone={async (itemId, cost) => {
                  if (!vm.tracker) return;
                  await vm.tracker.markMaintenanceDone(itemId, { cost });
                  await vm.reload();
                }}
              />
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
              onTabChange={setActiveTab}
              onFabClick={() => setIsQuickActionsOpen(true)}
            />

            {/* Quick Actions Drawer Popout */}
            <QuickActionsModal
              isOpen={isQuickActionsOpen}
              onClose={() => setIsQuickActionsOpen(false)}
              onOpenAddTransaction={() => {
                setScannedData(null);
                setIsAddModalOpen(true);
              }}
              onOpenScanReceipt={() => setIsScanModalOpen(true)}
              onOpenPasteSms={() => setIsPasteSmsOpen(true)}
              onOpenStatementReconcile={() => setIsStatementOpen(true)}
            />

            {/* AI Receipt Scanner Modal */}
            <ScanReceiptModal
              isOpen={isScanModalOpen}
              onClose={() => setIsScanModalOpen(false)}
              onReceiptScanned={(parsed) => {
                setScannedData(parsed);
                setIsScanModalOpen(false);
                setIsAddModalOpen(true);
              }}
            />

            {/* Paste Bank SMS Modal */}
            <PasteSmsModal
              isOpen={isPasteSmsOpen}
              onClose={() => setIsPasteSmsOpen(false)}
              onSmsParsed={(parsed) => {
                setScannedData({
                  amount: parsed.amount,
                  category: parsed.category,
                  description: parsed.description,
                  date: parsed.date,
                  note: parsed.description,
                  paymentMethod: parsed.paymentMethod,
                });
                setIsPasteSmsOpen(false);
                setIsAddModalOpen(true);
              }}
            />

            {/* Bank Statement Reconciliation Modal */}
            <StatementReconciliationModal
              isOpen={isStatementOpen}
              onClose={() => setIsStatementOpen(false)}
              onImportReconciledItems={async (items) => {
                if (!vm.tracker) return;
                for (const item of items) {
                  await vm.tracker.addTransaction({
                    date: item.date,
                    type: "expense",
                    category: item.category,
                    amount: item.amount,
                    description: item.description,
                    paymentType: item.paymentMethod,
                    remarks: "Reconciled from Bank Statement",
                  });
                }
                await vm.reload();
              }}
            />

            {/* Add Expense Modal Drawer */}
            <AddExpenseModal
              isOpen={isAddModalOpen}
              onClose={() => {
                setIsAddModalOpen(false);
                setScannedData(null);
              }}
              onSubmit={handleAddTransactionSubmit}
              initialData={scannedData}
            />
          </>
        )}
      </div>
    </div>
  );
}
