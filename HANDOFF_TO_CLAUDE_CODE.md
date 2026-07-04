# Opening this in Claude Code

This project is a ready-to-go Claude Code workspace: it has a `CLAUDE.md`
(project brief + guardrails Claude Code reads automatically), a `.gitignore`,
and an initialized git repo with one commit.

## Fastest path

1. Unzip `spotdesk.zip` somewhere permanent, e.g. `~/projects/spotdesk`.
2. Open a terminal in that folder and run:
   ```bash
   npm install
   npm run test:logic     # should print "All 17 checks passed."
   ```
3. Point Claude Code at the folder:
   ```bash
   cd ~/projects/spotdesk
   claude
   ```
   Claude Code picks up `CLAUDE.md` on start, so it immediately knows the
   architecture and the logic invariants it must not break.

That's it. From inside Claude Code you can ask it to run the app
(`npm run tauri dev`), build installers (`npm run tauri build`), or make
changes — the tests guard the business logic.

## If you'd rather use GitHub

The repo is already initialized and committed. To push it:

```bash
cd ~/projects/spotdesk
# create an empty repo on GitHub first (no README), then:
git remote add origin https://github.com/<you>/spotdesk.git
git branch -M main
git push -u origin main
```

Then in Claude Code you can clone or open it like any other repo.

## What's included / excluded

- Included: all source, `CLAUDE.md`, `README.md`, `BUILD_INSTRUCTIONS.md`, the
  original `spot-tracker.html` (reference source of truth), the brief PDF, the
  test fixture (`tests/fixture_day4.json` = your `spotdesk_day4_repaired.json`),
  pre-generated Tauri icons, and the `.git` history.
- Excluded by `.gitignore`: `node_modules/` (run `npm install`),
  `src-tauri/target/` and `src-tauri/gen/` (created on first Tauri build),
  and any `*.db` / `backups/` so your real trading data never gets committed.

## First thing to try once it runs

Launch the app → **⤒ Import backup** → select
`tests/fixture_day4.json` (or your own `spotdesk_day4_repaired.json`). You'll
land on Day 4 with all 28 live accounts, names, colors and sheet links, and
everything autosaves to SQLite from then on.

## Prerequisites reminder

Node 18+ is enough for `npm run test:logic` and `npm run dev` (browser UI).
To run/build the actual desktop app you also need the **Rust toolchain** and
your platform's WebView deps — see `BUILD_INSTRUCTIONS.md`.
