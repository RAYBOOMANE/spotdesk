# SPOTDESK — desktop app (Tauri v2 + React + SQLite)

Prop-firm spot ladder tracker, ported from the single-file `spot-tracker.html`
into a native desktop app with **automatic SQLite persistence** — no more
localStorage wipes.

## What's inside

- **Logic ported verbatim** (`src/lib/logic.ts`, `src/lib/ladder.ts`) — every
  rule from the reference: the 14-day LADDER, phase-aware `cumInvest`, the
  fixed FWD lookup (D8–13 = 728.52, D14 = 750), blank-field fallbacks (single
  blow → cumInvest, single payout & all multi ops → flat day benchmark),
  traded-today marking, the New Day roll (fold extra → cost, advance only
  traded, cap D14), payout-keeps-account, total = blows + payout *profit*
  (gross excluded), packages by cluster color, capacity math, log delete/undo,
  editable banked days.
- **17 automated acceptance checks** (`npm run test:logic`) including a real
  import of `spotdesk_day4_repaired.json` (day 4, 28 live accounts, 20 named
  clusters, +$3,625.67 equity).
- **Persistence**: SQLite via the Tauri SQL plugin. Every state change is
  autosaved (debounced ~250 ms) into `app_state`; every New Day also writes a
  point-in-time row into `snapshots` (last 60 kept) **and** an automatic JSON
  backup file. The header shows a live "saved to SQLite HH:MM:SS" indicator
  with read-back verification.
- **Backups**: manual Export writes a `spotdesk_day{N}_{timestamp}.json`
  anywhere you choose; Import reads the exact same schema as the old HTML app
  (your existing backups work in both directions).

## Where your data lives

- SQLite DB: the app data dir, e.g.
  - Windows: `%APPDATA%\com.spotdesk.app\spotdesk.db`
  - macOS: `~/Library/Application Support/com.spotdesk.app/spotdesk.db`
  - Linux: `~/.local/share/com.spotdesk.app/spotdesk.db`
- Auto backups: `<app data dir>/backups/spotdesk_day{N}_….json` (one per New Day)

## First run with your real data

1. Launch the app → **⤒ Import backup** → pick `spotdesk_day4_repaired.json`
2. Confirm — you're on Day 4 with all 28 live accounts, names, colors and
   sheet links. From then on everything autosaves to SQLite.

See **BUILD_INSTRUCTIONS.md** to compile.
