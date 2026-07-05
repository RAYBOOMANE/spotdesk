// The current (and, for now, only) BackupService implementation. Bodies
// moved VERBATIM from the old src/lib/backup.ts — same dialog/fs plugin
// calls, same $APPDATA/backups/ path, same filename format. importFromText
// and openExternal stay in backup.ts (no adapter dependency, not moved).

import type { AppState } from "@/lib/types";
import { normalizeImport } from "@/lib/logic";
import { isTauri } from "./platform";
import type { BackupService } from "./types";

export function backupFilename(state: AppState): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `spotdesk_day${state.dayCount}_${stamp}.json`;
}

function browserDownload(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Manual "Save / Export backup" — user picks where the file goes.
export async function exportBackup(state: AppState): Promise<string | null> {
  const json = JSON.stringify(state, null, 2);
  const filename = backupFilename(state);
  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "SPOTDESK backup", extensions: ["json"] }],
    });
    if (!path) return null;
    await writeTextFile(path, json);
    return path;
  }
  browserDownload(filename, json);
  return filename;
}

// Automatic backup on every New Day — written silently into the app data
// folder (…/com.spotdesk.app/backups/), no dialog, no user action.
export async function autoBackup(state: AppState): Promise<string | null> {
  const json = JSON.stringify(state, null, 2);
  const filename = backupFilename(state);
  if (isTauri) {
    try {
      const fs = await import("@tauri-apps/plugin-fs");
      await fs.mkdir("backups", { baseDir: fs.BaseDirectory.AppData, recursive: true });
      await fs.writeTextFile(`backups/${filename}`, json, { baseDir: fs.BaseDirectory.AppData });
      return filename;
    } catch (e) {
      console.error("autoBackup failed", e);
      return null;
    }
  }
  browserDownload(filename, json);
  return filename;
}

// Import — reads the exact schema of spotdesk_day4_repaired.json.
export async function importBackupViaDialog(): Promise<AppState | null> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await open({
      multiple: false,
      filters: [{ name: "SPOTDESK backup", extensions: ["json"] }],
    });
    if (!path || Array.isArray(path)) return null;
    const text = await readTextFile(path as string);
    return normalizeImport(JSON.parse(text));
  }
  return null; // browser dev uses a hidden <input type=file> instead
}

export const localBackupService: BackupService = {
  exportBackup,
  autoBackup,
  importBackupViaDialog,
};
