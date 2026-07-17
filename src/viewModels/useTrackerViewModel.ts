import { useCallback, useEffect, useMemo, useState } from "react";
import { SheetsRepository, spreadsheetIdFrom } from "../model/sheets";
import { Tracker } from "../model/tracker";
import type { TrackerData } from "../model/tracker";

const SHEET_KEY = "paytrack.spreadsheetId";

/** Owns the connected spreadsheet and all tracker read-model refreshes. */
export function useTrackerViewModel(accessToken: string | null) {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem(SHEET_KEY));
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tracker = useMemo(() => accessToken && spreadsheetId ? new Tracker(new SheetsRepository(spreadsheetId, accessToken)) : null, [accessToken, spreadsheetId]);

  const reload = useCallback(async () => {
    if (!tracker) return;
    setLoading(true); setError(null);
    try { setData(await tracker.load()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load the spreadsheet."); } finally { setLoading(false); }
  }, [tracker]);

  useEffect(() => { void reload(); }, [reload]);

  const connect = useCallback(async (sheetLink: string, initialize: boolean) => {
    if (!accessToken) throw new Error("Sign in and grant Google Sheets access first.");
    const id = spreadsheetIdFrom(sheetLink);
    const repository = new SheetsRepository(id, accessToken);
    if (initialize) await repository.initializeTemplate();
    localStorage.setItem(SHEET_KEY, id); setSpreadsheetId(id);
  }, [accessToken]);

  const disconnect = useCallback(() => { localStorage.removeItem(SHEET_KEY); setSpreadsheetId(null); setData(null); }, []);
  return { tracker, data, loading, error, spreadsheetId, connect, disconnect, reload };
}
