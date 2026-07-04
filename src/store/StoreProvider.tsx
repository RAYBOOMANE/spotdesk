import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { AppState, Maybe, OutcomeType } from "@/lib/types";
import * as L from "@/lib/logic";
import { flushSave, loadState, scheduleSave, snapshotState, type SaveStatus } from "@/lib/persistence";
import { autoBackup } from "@/lib/backup";

interface Store {
  state: AppState;
  saveStatus: SaveStatus;
  setDaySingle: (id: string, day: number, cost: Maybe, extra: Maybe) => void;
  logOutcomeSingle: (id: string, day: number, type: OutcomeType, cost: Maybe, extra: Maybe, amount: Maybe) => void;
  freeSpot: (id: string) => void;
  multiSetDay: (ids: string[], day: number, cost: Maybe, extra: Maybe) => void;
  multiOutcome: (ids: string[], day: number, type: OutcomeType, cost: Maybe, extra: Maybe, amount: Maybe) => void;
  multiFree: (ids: string[]) => void;
  deleteLog: (idx: number) => void;
  rollDay: () => Promise<void>;
  editHistoryDay: (idx: number, f: L.DayEditFields) => void;
  renameCluster: (c: number, name: string) => void;
  setColor: (c: number, hex: string) => void;
  cycleColor: (c: number) => void;
  setSheet: (c: number, url: string) => void;
  saveCapacity: (cc: number, ca: number, names: Record<string, string>) => void;
  clearCapacity: () => void;
  importState: (st: AppState) => void;
  resetAll: () => void;
}

const StoreCtx = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

function timeNow() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ ok: null, time: "" });
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setState(loaded ?? L.freshState());
      hydrated.current = true;
    })();
  }, []);

  // Autosave on EVERY state change (debounced) — SQLite in the desktop app.
  useEffect(() => {
    if (!hydrated.current || !state) return;
    scheduleSave(state, (ok) => setSaveStatus({ ok, time: timeNow() }));
  }, [state]);

  // Flush pending writes if the window is closed mid-debounce.
  useEffect(() => {
    const onHide = () => {
      void flushSave((ok) => setSaveStatus({ ok, time: timeNow() }));
    };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  const apply = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs text-dim">
        ● loading SPOTDESK…
      </div>
    );
  }

  const store: Store = {
    state,
    saveStatus,
    setDaySingle: (id, day, cost, extra) => apply((s) => L.setDaySingle(s, id, day, cost, extra)),
    logOutcomeSingle: (id, day, type, cost, extra, amount) =>
      apply((s) => L.logOutcomeSingle(s, id, day, type, cost, extra, amount)),
    freeSpot: (id) => apply((s) => L.freeSpotSingle(s, id)),
    multiSetDay: (ids, day, cost, extra) => apply((s) => L.multiSetDay(s, ids, day, cost, extra)),
    multiOutcome: (ids, day, type, cost, extra, amount) =>
      apply((s) => L.multiOutcome(s, ids, day, type, cost, extra, amount)),
    multiFree: (ids) => apply((s) => L.multiFree(s, ids)),
    deleteLog: (idx) => apply((s) => L.deleteLog(s, idx)),
    rollDay: async () => {
      // compute next synchronously so we can snapshot + auto-export it
      const next = L.rollDay(state);
      setState(next);
      await snapshotState(`new-day-${next.dayCount}`, next);
      await autoBackup(next); // auto JSON backup on every New Day
    },
    editHistoryDay: (idx, f) => apply((s) => L.editHistoryDay(s, idx, f)),
    renameCluster: (c, name) => apply((s) => L.renameCluster(s, c, name)),
    setColor: (c, hex) => apply((s) => L.setColor(s, c, hex)),
    cycleColor: (c) => apply((s) => L.cycleColor(s, c)),
    setSheet: (c, url) => apply((s) => L.setSheet(s, c, url)),
    saveCapacity: (cc, ca, names) => apply((s) => L.saveCapacity(s, cc, ca, names)),
    clearCapacity: () => apply((s) => L.clearCapacity(s)),
    importState: (st) => setState(st),
    resetAll: () => setState(L.freshState()),
  };

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}
