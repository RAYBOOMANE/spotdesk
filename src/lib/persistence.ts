// ─────────────────────────────────────────────────────────────────────
// Persistence — the reason for this rebuild.
// In the desktop app: a real SQLite database on disk (Tauri SQL plugin).
//   • app_state  — single row holding the full current state (autosaved,
//     debounced, on EVERY state change; survives quit + relaunch)
//   • snapshots  — a point-in-time copy taken on every New Day (safety net)
// In a plain browser (npm run dev without Tauri): falls back to localStorage
// so the UI is still developable — but the shipped app always uses SQLite.
// ─────────────────────────────────────────────────────────────────────

import type { AppState } from "./types";
import { normalizeImport } from "./logic";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const WEB_KEY = "spotdesk_v2"; // same key the old HTML app used — dev fallback only

export interface SaveStatus {
  ok: boolean | null; // null = not attempted yet
  time: string;
}

type Db = {
  execute: (q: string, params?: unknown[]) => Promise<unknown>;
  select: <T>(q: string, params?: unknown[]) => Promise<T>;
};

let dbPromise: Promise<Db> | null = null;

async function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const Database = (await import("@tauri-apps/plugin-sql")).default;
      const db = (await Database.load("sqlite:spotdesk.db")) as unknown as Db;
      await db.execute(
        `CREATE TABLE IF NOT EXISTS app_state (
           id INTEGER PRIMARY KEY CHECK (id = 1),
           data TEXT NOT NULL,
           updated_at TEXT NOT NULL
         )`
      );
      await db.execute(
        `CREATE TABLE IF NOT EXISTS snapshots (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           label TEXT,
           data TEXT NOT NULL,
           created_at TEXT NOT NULL
         )`
      );
      return db;
    })();
  }
  return dbPromise;
}

export async function loadState(): Promise<AppState | null> {
  try {
    if (isTauri) {
      const db = await getDb();
      const rows = await db.select<{ data: string }[]>("SELECT data FROM app_state WHERE id = 1");
      // Route every load through normalizeImport so state saved by an older
      // schema version (missing a field added since, e.g. objectives) gets
      // backfilled instead of crashing on the missing field at render time.
      if (rows && rows.length > 0) return normalizeImport(JSON.parse(rows[0].data));
      // one-time migration path: if the user previously ran the HTML app in
      // this same webview profile, pull its localStorage state forward.
      const legacy = localStorage.getItem(WEB_KEY);
      if (legacy) {
        const st = normalizeImport(JSON.parse(legacy));
        await saveStateNow(st);
        return st;
      }
      return null;
    }
    const raw = localStorage.getItem(WEB_KEY);
    return raw ? normalizeImport(JSON.parse(raw)) : null;
  } catch (e) {
    console.error("loadState failed", e);
    return null;
  }
}

export async function saveStateNow(state: AppState): Promise<boolean> {
  const json = JSON.stringify(state);
  try {
    if (isTauri) {
      const db = await getDb();
      await db.execute(
        `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, $2)
         ON CONFLICT(id) DO UPDATE SET data = $1, updated_at = $2`,
        [json, new Date().toISOString()]
      );
      // read-back verification, like the original save indicator
      const rows = await db.select<{ n: number }[]>("SELECT length(data) AS n FROM app_state WHERE id = 1");
      return !!(rows && rows[0] && rows[0].n > 0);
    }
    localStorage.setItem(WEB_KEY, json);
    return localStorage.getItem(WEB_KEY) === json;
  } catch (e) {
    console.error("saveStateNow failed", e);
    return false;
  }
}

// Debounced autosave — fires on every state change, coalesced to ~250 ms.
let timer: ReturnType<typeof setTimeout> | null = null;
let pending: AppState | null = null;

export function scheduleSave(state: AppState, onResult: (ok: boolean) => void) {
  pending = state;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const st = pending;
    pending = null;
    timer = null;
    if (st) onResult(await saveStateNow(st));
  }, 250);
}

// Flush any pending save immediately (used before quit / before backup).
export async function flushSave(onResult?: (ok: boolean) => void) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending) {
    const st = pending;
    pending = null;
    const ok = await saveStateNow(st);
    onResult?.(ok);
  }
}

// Point-in-time snapshot in SQLite (taken on every New Day).
export async function snapshotState(label: string, state: AppState) {
  if (!isTauri) return;
  try {
    const db = await getDb();
    await db.execute("INSERT INTO snapshots (label, data, created_at) VALUES ($1, $2, $3)", [
      label,
      JSON.stringify(state),
      new Date().toISOString(),
    ]);
    // keep the last 60 snapshots
    await db.execute(
      "DELETE FROM snapshots WHERE id NOT IN (SELECT id FROM snapshots ORDER BY id DESC LIMIT 60)"
    );
  } catch (e) {
    console.error("snapshot failed", e);
  }
}
