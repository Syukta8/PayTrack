import React from "react";

export type NavTab = "home" | "bills" | "maintenance" | "settings";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onFabClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onFabClick,
}) => {
  return (
    <nav className="bottom-nav-bar">
      <button
        className={`nav-item ${activeTab === "home" ? "active" : ""}`}
        onClick={() => onTabChange("home")}
      >
        <svg className="nav-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </button>

      <button
        className={`nav-item ${activeTab === "bills" ? "active" : ""}`}
        onClick={() => onTabChange("bills")}
      >
        <svg className="nav-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Bills</span>
      </button>

      <button
        className="fab-center-btn"
        onClick={onFabClick}
        aria-label="Quick Actions"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "#0f172a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -24,
          border: "3px solid var(--bg-surface)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        className={`nav-item ${activeTab === "maintenance" ? "active" : ""}`}
        onClick={() => onTabChange("maintenance")}
      >
        <svg className="nav-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Maintenance</span>
      </button>

      <button
        className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
        onClick={() => onTabChange("settings")}
      >
        <svg className="nav-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  );
};
