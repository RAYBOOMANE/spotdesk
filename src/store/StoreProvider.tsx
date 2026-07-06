import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  AppLogin,
  AppState,
  ClientProfile,
  Maybe,
  MoneyHeldEntry,
  Objectives,
  OutcomeType,
  PaymentMethod,
  Settlement,
  Task,
  TaskStep,
  VpsInfo,
  WithdrawalMethod,
} from "@/lib/types";
import * as L from "@/lib/logic";
import type { SaveStatus } from "@/lib/persistence";
import { flushSave, saveImmediately, scheduleSave } from "@/lib/dataService/autosaveService";
import { getBackupService, getStorageAdapter, type SnapshotMeta } from "@/lib/dataService";

interface Store {
  state: AppState;
  saveStatus: SaveStatus;
  setDaySingle: (id: string, day: number, cost: Maybe, extra: Maybe) => void;
  logOutcomeSingle: (id: string, day: number, type: OutcomeType, cost: Maybe, extra: Maybe, amount: Maybe) => void;
  freeSpot: (id: string) => void;
  multiSetDay: (ids: string[], day: number, cost: Maybe, extra: Maybe) => void;
  multiOutcome: (ids: string[], day: number, type: OutcomeType, cost: Maybe, extra: Maybe, amount: Maybe) => void;
  copyTradeOutcome: (ids: string[], type: OutcomeType, grossPerAccount: Maybe) => void;
  copyTradeInvest: (ids: string[], totalAmount: number) => void;
  multiFree: (ids: string[]) => void;
  deleteLog: (idx: number) => void;
  editTodayLogEntry: (idx: number, patch: L.EditLogEntryFields) => void;
  rollDay: () => Promise<void>;
  editHistoryDay: (idx: number, f: L.DayEditFields) => void;
  renameCluster: (c: number, name: string) => void;
  setColor: (c: number, hex: string) => void;
  cycleColor: (c: number) => void;
  setSheet: (c: number, url: string) => void;
  saveCapacity: (cc: number, ca: number, names: Record<string, string>) => void;
  clearCapacity: () => void;
  setCapitalLimit: (limit: number) => void;
  setObjectives: (patch: Partial<Objectives>) => void;
  setManagerSplit: (hex: string, pct: number) => void;
  setManagerName: (hex: string, name: string) => void;
  addMoneyHeld: (entry: Omit<MoneyHeldEntry, "id">) => void;
  updateMoneyHeld: (id: string, patch: Partial<MoneyHeldEntry>) => void;
  deleteMoneyHeld: (id: string) => void;
  setClientProfileField: (
    cluster: number,
    patch: Partial<Pick<ClientProfile, "firstName" | "familyName" | "address" | "vpsLocation">>
  ) => void;
  setVpsInfo: (cluster: number, patch: Partial<VpsInfo>) => void;
  addAppLogin: (cluster: number, login: Omit<AppLogin, "id">) => void;
  updateAppLogin: (cluster: number, id: string, patch: Partial<AppLogin>) => void;
  removeAppLogin: (cluster: number, id: string) => void;
  addPaymentMethod: (cluster: number, pm: Omit<PaymentMethod, "id">) => void;
  updatePaymentMethod: (cluster: number, id: string, patch: Partial<PaymentMethod>) => void;
  removePaymentMethod: (cluster: number, id: string) => void;
  addWithdrawalMethod: (cluster: number, wm: Omit<WithdrawalMethod, "id">) => void;
  updateWithdrawalMethod: (cluster: number, id: string, patch: Partial<WithdrawalMethod>) => void;
  removeWithdrawalMethod: (cluster: number, id: string) => void;
  addSettlement: (entryId: string, settlement: Omit<Settlement, "id">) => void;
  addTask: (fields: {
    title: string;
    notes?: string;
    urgency?: Task["urgency"];
    importance?: Task["importance"];
    deadline?: string;
    steps?: Omit<TaskStep, "id">[];
  }) => void;
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, "title" | "notes" | "status" | "urgency" | "importance" | "deadline">>
  ) => void;
  deleteTask: (id: string) => void;
  setTaskProgressManual: (id: string, pct: number) => void;
  resetTaskProgressToAuto: (id: string) => void;
  addStep: (taskId: string, step: Omit<TaskStep, "id">) => void;
  updateStep: (taskId: string, stepId: string, patch: Partial<Omit<TaskStep, "id">>) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  deleteStep: (taskId: string, stepId: string) => void;
  importState: (st: AppState) => void;
  resetAll: () => void;
  listSnapshots: () => Promise<SnapshotMeta[]>;
  createRestorePoint: (reason: string) => Promise<void>;
  restoreFromSnapshot: (id: number) => Promise<void>;
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
      const loaded = await getStorageAdapter().loadState();
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

  // For critical actions (a logged blow/payout, a delete, an edit, an
  // objective/task/client-profile change — see the CLAUDE.md/task list this
  // implements): compute `next` from the CURRENT state directly (same
  // pattern rollDay already used) so we can flush it to disk immediately,
  // bypassing the 250ms debounce, instead of waiting on the effect below.
  const applyAndFlush = (fn: (s: AppState) => AppState) => {
    if (!state) return;
    const next = fn(state);
    setState(next);
    void saveImmediately(next, (ok) => setSaveStatus({ ok, time: timeNow() }));
  };

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
    // Critical actions (real money entries) flush to disk immediately —
    // see applyAndFlush above — instead of waiting on the debounced effect.
    setDaySingle: (id, day, cost, extra) => applyAndFlush((s) => L.setDaySingle(s, id, day, cost, extra)),
    logOutcomeSingle: (id, day, type, cost, extra, amount) =>
      applyAndFlush((s) => L.logOutcomeSingle(s, id, day, type, cost, extra, amount)),
    freeSpot: (id) => apply((s) => L.freeSpotSingle(s, id)),
    multiSetDay: (ids, day, cost, extra) => applyAndFlush((s) => L.multiSetDay(s, ids, day, cost, extra)),
    multiOutcome: (ids, day, type, cost, extra, amount) =>
      applyAndFlush((s) => L.multiOutcome(s, ids, day, type, cost, extra, amount)),
    copyTradeOutcome: (ids, type, grossPerAccount) =>
      applyAndFlush((s) => L.copyTradeOutcome(s, ids, type, grossPerAccount)),
    copyTradeInvest: (ids, totalAmount) => applyAndFlush((s) => L.copyTradeInvest(s, ids, totalAmount)),
    multiFree: (ids) => apply((s) => L.multiFree(s, ids)),
    deleteLog: (idx) => applyAndFlush((s) => L.deleteLog(s, idx)),
    editTodayLogEntry: (idx, patch) => applyAndFlush((s) => L.editTodayLogEntry(s, idx, patch)),
    rollDay: async () => {
      // Restore point: state exactly as it was right before this roll, so
      // an accidental New Day can be undone from the Data Safety panel.
      await getStorageAdapter().saveSnapshot(`before-new-day-${state.dayCount}`, state);
      // compute next synchronously so we can snapshot + auto-export it
      const next = L.rollDay(state);
      setState(next);
      const ok = (await getStorageAdapter().saveState(next)).ok; // immediate flush of the live row
      setSaveStatus({ ok, time: timeNow() });
      await getStorageAdapter().saveSnapshot(`new-day-${next.dayCount}`, next);
      await getBackupService().autoBackup(next); // auto JSON backup on every New Day
    },
    editHistoryDay: (idx, f) => apply((s) => L.editHistoryDay(s, idx, f)),
    renameCluster: (c, name) => apply((s) => L.renameCluster(s, c, name)),
    setColor: (c, hex) => apply((s) => L.setColor(s, c, hex)),
    cycleColor: (c) => apply((s) => L.cycleColor(s, c)),
    setSheet: (c, url) => apply((s) => L.setSheet(s, c, url)),
    saveCapacity: (cc, ca, names) => apply((s) => L.saveCapacity(s, cc, ca, names)),
    clearCapacity: () => apply((s) => L.clearCapacity(s)),
    setCapitalLimit: (limit) => apply((s) => L.setCapitalLimit(s, limit)),
    setObjectives: (patch) => applyAndFlush((s) => L.setObjectives(s, patch)),
    setManagerSplit: (hex, pct) => apply((s) => L.setManagerSplit(s, hex, pct)),
    setManagerName: (hex, name) => apply((s) => L.setManagerName(s, hex, name)),
    addMoneyHeld: (entry) => applyAndFlush((s) => L.addMoneyHeld(s, entry)),
    updateMoneyHeld: (id, patch) => applyAndFlush((s) => L.updateMoneyHeld(s, id, patch)),
    deleteMoneyHeld: (id) => applyAndFlush((s) => L.deleteMoneyHeld(s, id)),
    setClientProfileField: (cluster, patch) => applyAndFlush((s) => L.setClientProfileField(s, cluster, patch)),
    setVpsInfo: (cluster, patch) => applyAndFlush((s) => L.setVpsInfo(s, cluster, patch)),
    addAppLogin: (cluster, login) => applyAndFlush((s) => L.addAppLogin(s, cluster, login)),
    updateAppLogin: (cluster, id, patch) => applyAndFlush((s) => L.updateAppLogin(s, cluster, id, patch)),
    removeAppLogin: (cluster, id) => applyAndFlush((s) => L.removeAppLogin(s, cluster, id)),
    addPaymentMethod: (cluster, pm) => applyAndFlush((s) => L.addPaymentMethod(s, cluster, pm)),
    updatePaymentMethod: (cluster, id, patch) => applyAndFlush((s) => L.updatePaymentMethod(s, cluster, id, patch)),
    removePaymentMethod: (cluster, id) => applyAndFlush((s) => L.removePaymentMethod(s, cluster, id)),
    addWithdrawalMethod: (cluster, wm) => applyAndFlush((s) => L.addWithdrawalMethod(s, cluster, wm)),
    updateWithdrawalMethod: (cluster, id, patch) =>
      applyAndFlush((s) => L.updateWithdrawalMethod(s, cluster, id, patch)),
    removeWithdrawalMethod: (cluster, id) => applyAndFlush((s) => L.removeWithdrawalMethod(s, cluster, id)),
    addSettlement: (entryId, settlement) => applyAndFlush((s) => L.addSettlement(s, entryId, settlement)),
    addTask: (fields) => applyAndFlush((s) => L.addTask(s, fields)),
    updateTask: (id, patch) => applyAndFlush((s) => L.updateTask(s, id, patch)),
    deleteTask: (id) => applyAndFlush((s) => L.deleteTask(s, id)),
    setTaskProgressManual: (id, pct) => applyAndFlush((s) => L.setTaskProgressManual(s, id, pct)),
    resetTaskProgressToAuto: (id) => applyAndFlush((s) => L.resetTaskProgressToAuto(s, id)),
    addStep: (taskId, step) => applyAndFlush((s) => L.addStep(s, taskId, step)),
    updateStep: (taskId, stepId, patch) => applyAndFlush((s) => L.updateStep(s, taskId, stepId, patch)),
    toggleStep: (taskId, stepId) => applyAndFlush((s) => L.toggleStep(s, taskId, stepId)),
    deleteStep: (taskId, stepId) => applyAndFlush((s) => L.deleteStep(s, taskId, stepId)),
    importState: (st) => {
      const prev = state;
      void (async () => {
        await getStorageAdapter().saveSnapshot(`before-import-${new Date().toISOString()}`, prev);
        setState(st);
        const ok = (await getStorageAdapter().saveState(st)).ok;
        setSaveStatus({ ok, time: timeNow() });
      })();
    },
    resetAll: () => {
      const prev = state;
      void (async () => {
        await getStorageAdapter().saveSnapshot(`before-reset-${new Date().toISOString()}`, prev);
        const fresh = L.freshState();
        setState(fresh);
        const ok = (await getStorageAdapter().saveState(fresh)).ok;
        setSaveStatus({ ok, time: timeNow() });
      })();
    },
    listSnapshots: () => getStorageAdapter().listSnapshots(),
    createRestorePoint: async (reason) => {
      await getStorageAdapter().saveSnapshot(reason, state);
    },
    restoreFromSnapshot: async (id) => {
      const snap = await getStorageAdapter().loadSnapshot(id);
      if (!snap) return;
      // Safety net for the restore itself: you can undo an accidental restore too.
      await getStorageAdapter().saveSnapshot(`before-restore-${new Date().toISOString()}`, state);
      setState(snap);
      const ok = (await getStorageAdapter().saveState(snap)).ok;
      setSaveStatus({ ok, time: timeNow() });
    },
  };

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}
