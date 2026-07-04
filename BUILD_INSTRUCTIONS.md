# Building SPOTDESK

## Prerequisites (one-time)

1. **Node.js 18+** — https://nodejs.org
2. **Rust toolchain** — https://rustup.rs (`rustup` installs `cargo`)
3. **Platform deps for Tauri v2**:
   - **Windows**: Microsoft Visual Studio C++ Build Tools + WebView2
     (WebView2 ships with Windows 10/11 already).
   - **macOS**: `xcode-select --install`
   - **Linux (Debian/Ubuntu)**:
     ```
     sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
       libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
     ```
   Full list: https://tauri.app/start/prerequisites/

## Commands

```bash
cd spotdesk
npm install          # install JS deps

npm run test:logic   # 17 acceptance checks (all must pass)

npm run tauri dev    # run the desktop app in dev mode (hot reload)

npm run tauri build  # produce the installer / binary
```

`tauri build` outputs to `src-tauri/target/release/bundle/`:
- Windows: `.msi` and `.exe` (NSIS) installers
- macOS: `.app` and `.dmg`
- Linux: `.deb`, `.rpm`, `.AppImage`

First `tauri dev`/`build` compiles the Rust side once (a few minutes); after
that it's fast.

## Notes

- `npm run dev` alone opens the UI in a plain browser (localStorage fallback,
  dev only). The shipped desktop app always uses SQLite.
- Icons are pre-generated in `src-tauri/icons/`. To regenerate from a new
  source image: `npx tauri icon path/to/icon.png`.
- If the save pill ever shows "NOT saving", export a JSON backup immediately —
  same guidance as the original app.
