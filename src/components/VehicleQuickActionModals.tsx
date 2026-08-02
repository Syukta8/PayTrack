import { useEffect, useState } from "react";
import type { CarInfo, MaintenanceStatus } from "../model/types";

interface OdometerModalProps {
  isOpen: boolean;
  currentMileage: number;
  onClose: () => void;
  onSave: (mileage: number) => Promise<void>;
}

/** Collects a single odometer update from the global quick-action menu. */
export function OdometerModal({ isOpen, currentMileage, onClose, onSave }: OdometerModalProps) {
  const [mileage, setMileage] = useState(String(currentMileage));
  useEffect(() => { if (isOpen) setMileage(String(currentMileage)); }, [currentMileage, isOpen]);
  if (!isOpen) return null;
  const save = async () => {
    const value = Number(mileage);
    if (!Number.isFinite(value) || value < 0) return;
    await onSave(value);
    onClose();
  };
  return <div className="modal-overlay" onClick={onClose}><div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-drag-handle" />
    <div className="sheet-header"><button className="sheet-action-btn save" onClick={() => void save()}>Save</button><h3>Update Odometer</h3><button className="sheet-action-btn cancel" onClick={onClose}>Cancel</button></div>
    <label className="form-field-card"><div className="hero-eyebrow">CURRENT MILEAGE (KM)</div><input aria-label="Current mileage" type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} /></label>
  </div></div>;
}

interface MaintenanceServiceModalProps {
  isOpen: boolean;
  maintenance: MaintenanceStatus[];
  carInfo: CarInfo;
  onClose: () => void;
  onSave: (itemId: string, input: { date: string; mileage: number; cost: number; description: string }) => Promise<void>;
}

/** Records a completed service, advances its maintenance baseline, and optionally writes an expense. */
export function MaintenanceServiceModal({ isOpen, maintenance, carInfo, onClose, onSave }: MaintenanceServiceModalProps) {
  const [itemId, setItemId] = useState(maintenance[0]?.item.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState(String(carInfo.currentMileage));
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    setItemId(maintenance[0]?.item.id ?? "");
    setMileage(String(carInfo.currentMileage));
  }, [carInfo.currentMileage, isOpen, maintenance]);
  if (!isOpen) return null;
  const save = async () => {
    const mileageValue = Number(mileage);
    const costValue = cost ? Number(cost) : 0;
    if (!itemId || !Number.isFinite(mileageValue) || mileageValue < 0 || !Number.isFinite(costValue) || costValue < 0) return;
    await onSave(itemId, { date, mileage: mileageValue, cost: costValue, description });
    onClose();
  };
  return <div className="modal-overlay" onClick={onClose}><div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-drag-handle" />
    <div className="sheet-header"><button className="sheet-action-btn save" onClick={() => void save()}>Save</button><h3>Maintenance Service</h3><button className="sheet-action-btn cancel" onClick={onClose}>Cancel</button></div>
    <div className="form-field-card">
      <div className="hero-eyebrow">MAINTENANCE ITEM</div><select aria-label="Maintenance item" value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Select an item</option>{maintenance.map(({ item }) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <div className="hero-eyebrow" style={{ marginTop: 10 }}>SERVICE DATE</div><input aria-label="Service date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <div className="hero-eyebrow" style={{ marginTop: 10 }}>ODOMETER (KM)</div><input aria-label="Service mileage" type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} />
      <div className="hero-eyebrow" style={{ marginTop: 10 }}>COST (RM) — OPTIONAL</div><input aria-label="Service cost" type="number" min="0" step="0.01" value={cost} onChange={(event) => setCost(event.target.value)} />
      <div className="hero-eyebrow" style={{ marginTop: 10 }}>NOTES — OPTIONAL</div><input aria-label="Service notes" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Full synthetic oil and filter" />
    </div>
  </div></div>;
}
