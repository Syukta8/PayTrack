import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  trackingCycleStartDay: number;
  onTrackingCycleStartDayChange: (day: number) => Promise<void>;
  accountEmail?: string | null;
  isDemo: boolean;
  onSignOut: () => void;
}

/** Renders account and appearance preferences independently from application orchestration. */
export function SettingsView({ themeMode, onThemeModeChange, trackingCycleStartDay, onTrackingCycleStartDayChange, accountEmail, isDemo, onSignOut }: SettingsViewProps) {
  const [cycleStartDay, setCycleStartDay] = useState(String(trackingCycleStartDay));
  const [cycleError, setCycleError] = useState<string | null>(null);

  useEffect(() => setCycleStartDay(String(trackingCycleStartDay)), [trackingCycleStartDay]);

  const saveTrackingCycle = async () => {
    const day = Number(cycleStartDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setCycleError("Enter a day from 1 to 31.");
      return;
    }
    setCycleError(null);
    await onTrackingCycleStartDayChange(day);
  };

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
      <div className="section-card" style={{ margin: "0 0 16px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 6 }}>Spending Cycle</div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
          Start dashboard reporting on your salary day. Recurring bills continue to use their real calendar due date.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", fontWeight: 600 }}>
          Cycle starts on day
          <input aria-label="Tracking cycle start day" type="number" min="1" max="31" value={cycleStartDay} onChange={(event) => setCycleStartDay(event.target.value)} style={{ width: 72 }} />
        </label>
        {cycleError && <div role="alert" style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: 8 }}>{cycleError}</div>}
        <button className="pill-btn active" style={{ marginTop: 12 }} onClick={() => void saveTrackingCycle()}>Save cycle</button>
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
