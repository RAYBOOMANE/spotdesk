// ─────────────────────────────────────────────────────────────────────
// Compatibility shim. The real implementation now lives in
// src/lib/dataService/ (localStorageAdapter.ts, autosaveService.ts).
// Kept in place (not deleted) so any existing import of isTauri / loadState /
// saveStateNow / scheduleSave / flushSave / snapshotState / SaveStatus keeps
// working unchanged — this is a low-risk rollback point, not dead code.
// ─────────────────────────────────────────────────────────────────────

import type { AppState } from "./types";
import { getStorageAdapter } from "@/lib/dataService";

export { isTauri } from "@/lib/dataService/platform";
export { scheduleSave, flushSave } from "@/lib/dataService/autosaveService";

export interface SaveStatus {
  ok: boolean | null; // null = not attempted yet
  time: string;
}

export async function loadState(): Promise<AppState | null> {
  return getStorageAdapter().loadState();
}

export async function saveStateNow(state: AppState): Promise<boolean> {
  return (await getStorageAdapter().saveState(state)).ok;
}

export async function snapshotState(label: string, state: AppState): Promise<void> {
  return getStorageAdapter().saveSnapshot(label, state);
}
