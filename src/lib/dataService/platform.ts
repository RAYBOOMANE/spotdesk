// Single source of truth for "are we running inside the Tauri desktop shell
// or a plain browser." Used by both the local storage adapter and the local
// backup service (and re-exported from persistence.ts for existing callers).
export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
