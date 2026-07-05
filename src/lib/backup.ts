// Compatibility shim for the file-based backup functions — the real
// implementation now lives in src/lib/dataService/localBackupService.ts.
// importFromText and openExternal stay defined here: neither has an adapter
// dependency (pure parsing / a platform shell action), so there was nothing
// to move for them.

import type { AppState } from "./types";
import { normalizeImport } from "./logic";
import { isTauri } from "@/lib/dataService/platform";

export { exportBackup, autoBackup, importBackupViaDialog, backupFilename } from "@/lib/dataService/localBackupService";

export function importFromText(text: string): AppState {
  return normalizeImport(JSON.parse(text));
}

export async function openExternal(url: string) {
  if (isTauri) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } else {
    window.open(url, "_blank");
  }
}
