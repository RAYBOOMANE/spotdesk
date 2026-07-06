// Narrow persistence interfaces — mirror exactly what the app already does
// (one JSON blob load/save + snapshots, separately: file/dialog backups).
// Not a generic ORM; deliberately not designed for a schema we don't have yet.

import type { AppState } from "@/lib/types";

export interface SaveResult {
  ok: boolean;
}

// A restore point: label = a human-readable reason ("before-import-...",
// "manual-...", a New Day marker), createdAt = when it was taken.
export interface SnapshotMeta {
  id: number;
  label: string;
  createdAt: string;
}

// State load/save/snapshot — the "where does the live app_state blob live" concern.
export interface StateStorageAdapter {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<SaveResult>;
  saveSnapshot(label: string, state: AppState): Promise<void>;
  listSnapshots(): Promise<SnapshotMeta[]>;
  loadSnapshot(id: number): Promise<AppState | null>;
}

// File-based backups — a SEPARATE concern from state storage. A future
// Supabase StateStorageAdapter should not be forced to also implement local
// filesystem/dialog behavior just to satisfy one interface.
export interface BackupService {
  exportBackup(state: AppState): Promise<string | null>;
  autoBackup(state: AppState): Promise<string | null>;
  importBackupViaDialog(): Promise<AppState | null>;
}
