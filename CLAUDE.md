# CLAUDE.md — SPOTDESK

Guidance for Claude Code (and any dev) working in this repo. Read this first.

## What this is

A desktop port of a single-file HTML app (`spot-tracker.html`, the original
"source of truth") that tracks a prop-firm trading operation. Accounts
("spots") climb a 14-day ladder; each day they either resolve (blow / payout)
or continue. Stack: **Tauri v2 + React 18 + TypeScript + Tailwind + shadcn-style
UI + recharts**, with **SQLite autosave** as the whole reason for the rebuild.

## Golden rule: the business logic is ported VERBATIM — do not "improve" it

All the math and rules live in **`src/lib/logic.ts`**, **`src/lib/ladder.ts`**,
and **`src/lib/stats.ts`** as pure functions (clone state → return next state).
They intentionally reproduce the original's behavior, including quirks. If you
change any number or rule below, you have broken parity. When in doubt, diff
against `spot-tracker.html` (kept in the repo root for reference) and re-run the
tests.

Invariants that MUST hold (all covered by `npm run test:logic`):

- **LADDER** D1–14 with `inv/p/prof/zone` exactly as in `ladder.ts`.
- **FWD** is a fixed lookup, not computed live: D1–2 = 11.25, D3 = 23.20,
  D4–7 = 150, D8–13 = `PHASE2_AVG` (= (1−0.95³)·900 + 0.95³·700 ≈ 728.52),
  D14 = 750.
- **`cumInvest(day)` is phase-aware**: sum from D1 for days 1–8, but sum from
  **D9 only** for days 9–14 (second leg uses fresh accounts).
- **Blank-field fallbacks (a real quirk — keep it):**
  - single **blow**, blank cost → `cumInvest(day)`
  - single **payout**, blank cost → `LADDER[day].inv`
  - **all multi ops**, blank cost → `LADDER[day].inv` (yes, even multi-blow)
  - blank gross → `LADDER[day].prof`
- **Traded-today** is marked on any blow/payout, and on Set Day **only if**
  `extra > 0 && extra !== prevExtra`. `deployedToday` increments by that extra.
- **New Day (`rollDay`)**: archive the day, fold `extra` into `cost` for every
  occupied account, advance **only** traded accounts +1 (cap at 14), reset
  today counters, `dayCount++`. Then snapshot + auto JSON backup.
- **Payout keeps the account** on the same day with `cost=0, extra=0`; **blow
  frees** the slot (`day=0`).
- **Total = blow profit + payout PROFIT.** Gross payout never contributes.
- **Capacity denom** = `capacityTarget>0 ? capacityTarget : 17×5`. Grid dims
  come from `capClusters/capAccts` (fallback 17/5).
- **Packages** = clusters grouped by color hex; week net = last 7 archived
  days' logs + today.
- **Import** requires `data.spots && data.history`; `normalizeImport` backfills
  missing fields. It must read `tests/fixture_day4.json`
  (= the user's `spotdesk_day4_repaired.json`) → Day 4, 28 live, 20 named
  clusters, +$3,625.67 equity.

## Architecture

```
src/lib/        pure logic + types, no React   ← the source of truth, tested
  ladder.ts     constants (LADDER, FWD, PACKAGE_COLORS)
  types.ts      AppState etc. — matches the JSON save schema exactly
  logic.ts      every state mutation as a pure fn
  stats.ts      derived read-only stats (top cards, equity, positions, packages)
  persistence.ts SQLite (Tauri SQL plugin) + localStorage dev fallback, debounced
  backup.ts     JSON export / import / auto-backup / open external URL
src/store/StoreProvider.tsx  React context: hydrate → autosave every change
src/components/  presentational; all state changes go through useStore()
  ui/           shadcn-style primitives (button, card, dialog, table, …)
  ConfirmProvider.tsx  promise-based confirm/alert/prompt (native dialogs are
                       unreliable in Tauri webviews — always use useDialogs())
src-tauri/       Rust shell, tauri.conf.json, capabilities, icons
tests/logic.test.ts  17 acceptance checks (the brief's §7)
```

Data flow: **UI → `useStore()` action → pure fn in `logic.ts` → new AppState →
`StoreProvider` autosaves (debounced ~250 ms) to SQLite.** Components never
mutate state directly and never touch persistence directly.

## Persistence specifics

- Desktop: SQLite at the app data dir, `sqlite:spotdesk.db`. Table `app_state`
  holds one row (the full state); `snapshots` keeps the last 60 New-Day copies.
- Every New Day also writes `backups/spotdesk_day{N}_{stamp}.json` silently.
- Browser (`npm run dev` without Tauri): falls back to `localStorage` key
  `spotdesk_v2` so the UI is developable. The shipped app always uses SQLite.
- If you add fields to `AppState`, update `normalizeImport` so old backups still
  load, and keep the exported JSON schema identical to the original app.

## Commands

```bash
npm install
npm run test:logic   # MUST stay green after any logic change
npm run tauri dev    # desktop app, hot reload (needs Rust toolchain)
npm run tauri build  # installers → src-tauri/target/release/bundle/
npm run dev          # browser-only UI (localStorage fallback, dev convenience)
npx tsc --noEmit     # type-check
```

## When changing things

1. Logic change → edit `src/lib/*`, add/adjust a case in `tests/logic.test.ts`,
   run `npm run test:logic`. Never let a check regress silently.
2. UI-only change → components + `ui/`, keep using CSS vars (`--live`, `--deep`,
   `--cool`, `--gold`, `--payout`, `--void`, `--panel`, …) for the terminal look.
3. New user action → add a pure fn in `logic.ts`, expose it in `StoreProvider`,
   call it from the component. Keep components dumb.
4. Rust/Tauri config → `src-tauri/`. Permissions live in
   `src-tauri/capabilities/default.json`.
