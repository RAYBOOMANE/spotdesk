// The one seam a future Supabase adapter plugs into. Today: always local.
import { localStorageAdapter } from "./localStorageAdapter";
import { localBackupService } from "./localBackupService";
import type { BackupService, StateStorageAdapter } from "./types";

export function getStorageAdapter(): StateStorageAdapter {
  return localStorageAdapter;
}

export function getBackupService(): BackupService {
  return localBackupService;
}

export type { BackupService, SaveResult, StateStorageAdapter, SnapshotMeta } from "./types";
