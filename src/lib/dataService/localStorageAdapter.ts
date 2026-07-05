// The current (and, for now, only) StateStorageAdapter implementation.
// Bodies moved VERBATIM from the old src/lib/persistence.ts — same SQLite
// table names/schema, same localStorage key, same read-back verification,
// same normalizeImport-on-load behavior. Nothing here should differ from
// what persistence.ts did before this refactor.

import type { AppState } from "@/lib/types";
import { normalizeImport } from "@/lib/logic";
import { isTauri } from "./platform";
import type { SaveResult, StateStorageAdapter } from "./types";

const WEB_KEY = "spotdesk_v2"; // same key the old HTML app used — dev fallback only

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

async function loadState(): Promise<AppState | null> {
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
        await saveState(st);
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

async function saveState(state: AppState): Promise<SaveResult> {
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
      return { ok: !!(rows && rows[0] && rows[0].n > 0) };
    }
    localStorage.setItem(WEB_KEY, json);
    return { ok: localStorage.getItem(WEB_KEY) === json };
  } catch (e) {
    console.error("saveStateNow failed", e);
    return { ok: false };
  }
}

// Point-in-time snapshot in SQLite (taken on every New Day).
async function saveSnapshot(label: string, state: AppState): Promise<void> {
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

export const localStorageAdapter: StateStorageAdapter = {
  loadState,
  saveState,
  saveSnapshot,
};
