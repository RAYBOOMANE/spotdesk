// Autosave orchestration — deliberately OUTSIDE StoreProvider/React. This is
// the exact debounce/pending-write/flush lifecycle moved verbatim from the
// old src/lib/persistence.ts (same 250ms coalescing, same module-level
// singleton timer/pending pattern — there is only ever one StoreProvider
// instance, so this doesn't need to be a class or take an adapter param).
// StoreProvider only ever CALLS scheduleSave/flushSave; it never owns this
// state itself.

import type { AppState } from "@/lib/types";
import { getStorageAdapter } from "./index";

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: AppState | null = null;

export function scheduleSave(state: AppState, onResult: (ok: boolean) => void) {
  pending = state;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const st = pending;
    pending = null;
    timer = null;
    if (st) onResult((await getStorageAdapter().saveState(st)).ok);
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
    const ok = (await getStorageAdapter().saveState(st)).ok;
    onResult?.(ok);
  }
}

// Save `state` right now, bypassing the 250ms debounce entirely, and cancel
// any pending debounced write so it can't redundantly race behind this one.
// Used for critical actions (a logged blow/payout, a delete, an edit — see
// StoreProvider's applyAndFlush) where waiting even 250ms risks losing the
// entry to a crash/quit in between.
export async function saveImmediately(state: AppState, onResult: (ok: boolean) => void) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  pending = null;
  const ok = (await getStorageAdapter().saveState(state)).ok;
  onResult(ok);
}
