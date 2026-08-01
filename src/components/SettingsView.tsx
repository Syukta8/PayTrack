export type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  accountEmail?: string | null;
  isDemo: boolean;
  onSignOut: () => void;
}

/** Renders account and appearance preferences independently from application orchestration. */
export function SettingsView({ themeMode, onThemeModeChange, accountEmail, isDemo, onSignOut }: SettingsViewProps) {
  return (
    <main style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 16 }}>Settings</h2>
      <div className="section-card" style={{ margin: "0 0 16px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>Appearance / Theme</div>
        <div className="segmented-tab-container" style={{ margin: 0 }}>
          {(["light", "dark", "system"] as const).map((mode) => (
            <button key={mode} className={`segmented-tab-btn ${themeMode === mode ? "active" : ""}`} onClick={() => onThemeModeChange(mode)}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="section-card" style={{ margin: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Account: <strong>{accountEmail || "Demo User"}</strong></div>
          {!isDemo && <button className="primary-dark-btn" onClick={onSignOut}>Sign Out</button>}
        </div>
      </div>
    </main>
  );
}
