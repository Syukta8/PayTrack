import React, { useState } from "react";
import type { BillStatus, CarInfo, MaintenanceStatus } from "../model/types";
import { calendarEventsInRange } from "../model/calendarEvents";

interface MaintenanceViewProps {
  maintenance: MaintenanceStatus[];
  bills: BillStatus[];
  carInfo: CarInfo;
  onSetMileage: (mileage: number) => Promise<void>;
  onAddMaintenance: (item: {
    name: string;
    notes: string;
    intervalMonths: number;
    intervalKm: number;
    lastServiceDate: string;
  }) => Promise<void>;
  onMarkDone: (itemId: string, cost?: number) => Promise<void>;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  bills,
  carInfo,
  onSetMileage,
  onAddMaintenance,
  onMarkDone,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMileageOpen, setIsMileageOpen] = useState(false);
  const [newMileageStr, setNewMileageStr] = useState(String(carInfo.currentMileage || ""));

  // Form states
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [intervalMonthsStr, setIntervalMonthsStr] = useState("6");
  const [intervalKmStr, setIntervalKmStr] = useState("10000");
  const [lastDate, setLastDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [serviceCostStr, setServiceCostStr] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Calendar states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    today.toISOString().split("T")[0]
  );

  const handleSaveMileage = async () => {
    const km = parseInt(newMileageStr, 10) || 0;
    await onSetMileage(km);
    setIsMileageOpen(false);
  };

  const handleSaveMaintenance = async () => {
    if (!name.trim()) return;
    await onAddMaintenance({
      name: name.trim(),
      notes: notes.trim(),
      intervalMonths: parseInt(intervalMonthsStr, 10) || 0,
      intervalKm: parseInt(intervalKmStr, 10) || 0,
      lastServiceDate: lastDate,
    });
    setName("");
    setNotes("");
    setIsAddOpen(false);
  };

  const handleCompleteService = async () => {
    if (!selectedItemId) return;
    const cost = parseFloat(serviceCostStr) || 0;
    await onMarkDone(selectedItemId, cost);
    setSelectedItemId(null);
    setServiceCostStr("");
  };

  // Calendar Grid Generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const calendarEvents = calendarEventsInRange(bills, maintenance, monthStart, monthEnd);
  const eventsByDate = new Map<string, typeof calendarEvents>();
  calendarEvents.forEach((event) => eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]));
  const selectedEvents = eventsByDate.get(selectedCalendarDate) ?? [];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div style={{ padding: "0 0 20px" }}>
      {/* Header & Odometer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Calendar</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Odometer: <strong>{carInfo.currentMileage.toLocaleString()} km</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="pill-btn active"
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            onClick={() => {
              setNewMileageStr(String(carInfo.currentMileage || ""));
              setIsMileageOpen(true);
            }}
          >
            Update km
          </button>
          <button
            className="primary-dark-btn"
            style={{ width: "auto", padding: "6px 12px", fontSize: "0.75rem" }}
            onClick={() => setIsAddOpen(true)}
          >
            + Task
          </button>
        </div>
      </div>

      {/* Interactive Maintenance Calendar Component */}
      <div className="section-card" style={{ margin: "0 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--bg-subtle)", borderRadius: 6 }}
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              }}
            >
              ◄
            </button>
            <button
              style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--bg-subtle)", borderRadius: 6 }}
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((y) => y + 1);
                } else {
                  setCurrentMonth((m) => m + 1);
                }
              }}
            >
              ►
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 8 }}>
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        {/* Month Days Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isSelected = selectedCalendarDate === dateStr;
            const isToday = dateStr === today.toISOString().split("T")[0];

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedCalendarDate(dateStr)}
                style={{
                  padding: "8px 0",
                  fontSize: "0.8rem",
                  fontWeight: isSelected || isToday ? 800 : 500,
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#0f172a" : isToday ? "var(--bg-subtle)" : "transparent",
                  color: isSelected ? "#ffffff" : isToday ? "var(--accent-blue)" : "var(--text-main)",
                }}
              >
                <span>{dayNum}</span>
                {eventsByDate.has(dateStr) && <span aria-label={`${eventsByDate.get(dateStr)?.length} scheduled items`} style={{ display: "block", fontSize: "0.55rem", color: isSelected ? "#bfdbfe" : "#2563eb", marginTop: 2 }}>●</span>}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <div>Selected Date: <strong>{selectedCalendarDate}</strong></div>
          {selectedEvents.length > 0 ? selectedEvents.map((event) => (
            <div key={event.id} style={{ marginTop: 6, color: event.kind === "bill" ? "#7c3aed" : "#0f766e" }}>
              {event.kind === "bill" ? "Bill due" : "Maintenance due"}: <strong>{event.title}</strong>
            </div>
          )) : <div style={{ marginTop: 6 }}>No scheduled bills or maintenance on this date.</div>}
        </div>
      </div>

      {/* Maintenance Items List */}
      <div className="section-card" style={{ margin: "0 20px 16px" }}>
        <div className="section-card-title" style={{ fontSize: "1rem", marginBottom: 12 }}>
          Service & Maintenance Items ({maintenance.length})
        </div>

        {maintenance.length > 0 ? (
          maintenance.map((m) => {
            const isOverdue = m.status === "overdue";
            const isDueSoon = m.status === "due_soon";

            return (
              <div
                key={m.item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: "0.9rem" }}>{m.item.name}</strong>
                    <span
                      className="badge-pill"
                      style={{
                        backgroundColor: isOverdue ? "#fee2e2" : isDueSoon ? "#fef3c7" : "#dcfce7",
                        color: isOverdue ? "#ef4444" : isDueSoon ? "#b45309" : "#166534",
                        fontSize: "0.68rem",
                      }}
                    >
                      {isOverdue ? "Service Overdue" : isDueSoon ? "Due Soon" : "OK"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Last: {m.item.lastServiceDate} ({m.item.lastServiceMileage.toLocaleString()} km)
                  </div>
                </div>

                <button
                  className="pill-btn active"
                  style={{ fontSize: "0.7rem", padding: "4px 10px" }}
                  onClick={() => setSelectedItemId(m.item.id)}
                >
                  Done
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
            No maintenance items tracked.
          </div>
        )}
      </div>

      {/* Update Mileage Modal */}
      {isMileageOpen && (
        <div className="modal-overlay" onClick={() => setIsMileageOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <button className="sheet-action-btn save" onClick={handleSaveMileage}>
                Save
              </button>
              <h3>Update Odometer</h3>
              <button className="sheet-action-btn cancel" onClick={() => setIsMileageOpen(false)}>
                Cancel
              </button>
            </div>

            <div className="form-field-card">
              <div className="hero-eyebrow">CURRENT MILEAGE (KM)</div>
              <input
                type="number"
                value={newMileageStr}
                onChange={(e) => setNewMileageStr(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <button className="sheet-action-btn save" onClick={handleSaveMaintenance}>
                Save
              </button>
              <h3>Add Maintenance Task</h3>
              <button className="sheet-action-btn cancel" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
            </div>

            <div className="form-field-card">
              <div className="hero-eyebrow">TASK NAME</div>
              <input
                type="text"
                placeholder="e.g. Engine Oil Service, Tire Rotation"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>INTERVAL (MONTHS)</div>
              <input
                type="number"
                value={intervalMonthsStr}
                onChange={(e) => setIntervalMonthsStr(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>INTERVAL (KM)</div>
              <input
                type="number"
                value={intervalKmStr}
                onChange={(e) => setIntervalKmStr(e.target.value)}
              />

              <div className="hero-eyebrow" style={{ marginTop: 8 }}>LAST SERVICE DATE</div>
              <input
                type="date"
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {selectedItemId && (
        <div className="modal-overlay" onClick={() => setSelectedItemId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <button className="sheet-action-btn save" onClick={handleCompleteService}>
                Save
              </button>
              <h3>Complete Maintenance</h3>
              <button className="sheet-action-btn cancel" onClick={() => setSelectedItemId(null)}>
                Cancel
              </button>
            </div>

            <div className="form-field-card">
              <div className="hero-eyebrow">SERVICE COST (RM) - OPTIONAL</div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00 (adds automatically to expense)"
                value={serviceCostStr}
                onChange={(e) => setServiceCostStr(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
