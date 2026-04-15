# Plan: Build VALXOS Terminal Desktop App

## Context

OpenCode already has a **complete Tauri v2 desktop app** at `packages/desktop/`. It's a full `.app` with Rust backend, Solid.js frontend, sidecar architecture, and all the bells and whistles (clipboard, notifications, deep-links, updater, window state persistence). It just needs **rebranding** and **building**.

The `packages/legion/` provider bridge was wired in Layer 1. Legion models route to Codex/Gemini/Ollama backends.

**Goal**: Rebrand OpenCode -> VALXOS Terminal, build the sidecar CLI, compile the Tauri app, and launch it as a real macOS `.app`.

---

## Step 1: Rebrand (5 files, ~15 lines)

### `packages/desktop/src-tauri/tauri.conf.json`
```
productName: "OpenCode Dev" -> "VALXOS Terminal"
identifier: "ai.opencode.desktop.dev" -> "org.valxb.valxos-terminal"
mainBinaryName: "OpenCode" -> "VALXOS"
deep-link scheme: "opencode" -> "valxos"
```

### `packages/desktop/src-tauri/src/constants.rs`
```
SETTINGS_STORE: "opencode.settings.dat" -> "valxos.settings.dat"
```

### `packages/desktop/index.html`
```
<title>OpenCode</title> -> <title>VALXOS Terminal</title>
```

### `packages/desktop/src-tauri/Cargo.toml`
```
name = "opencode-desktop" -> "valxos-desktop"
```

### `packages/desktop/src/index.tsx`
```
notification icon URL: opencode.ai -> local icon (or remove)
```

**NOT touching**: `window.__OPENCODE__` global, `OPENCODE_*` env vars, `opencode-cli` sidecar binary name (these are internal APIs the shared `@opencode-ai/app` package depends on - renaming them would break everything for no user-visible benefit).

---

## Step 2: Build Sidecar CLI Binary

The desktop app spawns `opencode-cli` as a child process (sidecar). The `predev.ts` script handles this:

```bash
cd packages/desktop
TAURI_ENV_TARGET_TRIPLE=aarch64-apple-darwin bun run predev
```

This runs `bun run build --single` in `packages/opencode/` to compile the CLI binary, then copies it to `src-tauri/sidecars/opencode-cli-aarch64-apple-darwin`.

---

## Step 3: Build & Launch Desktop App

```bash
# From project root:
bun run dev:desktop

# Or from packages/desktop:
cd packages/desktop
bun run tauri dev
```

This:
1. Starts Vite dev server on `localhost:1420` (Solid.js frontend)
2. Compiles Rust backend via `cargo build`
3. Launches the Tauri window
4. Sidecar CLI starts automatically on a random port
5. Frontend connects to sidecar HTTP API

---

## Step 4: Verify

1. App window opens with "VALXOS Terminal" in title bar
2. Chat interface loads (Solid.js UI from `@opencode-ai/app`)
3. Can type a message and get a response (sidecar routes to provider)
4. Legion models visible in model selector (from Layer 1 work)
5. Agent selector shows VALXOS agents (from `.opencode/agent/*.md` files)

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `packages/desktop/src-tauri/tauri.conf.json` | Rebrand product/identifier/binary/scheme | 4 |
| `packages/desktop/src-tauri/src/constants.rs` | Settings store name | 1 |
| `packages/desktop/index.html` | Title | 1 |
| `packages/desktop/src-tauri/Cargo.toml` | Package name | 1 |
| `packages/desktop/src/index.tsx` | Notification icon | 1 |

**Total**: ~8 lines changed across 5 files. Then build commands.

---

## Prerequisites Verified

- rustc 1.94.1 (Homebrew) - installed on M3
- cargo 1.94.1 - installed
- bun 1.3.11 - installed
- Tauri CLI - in desktop devDependencies (`@tauri-apps/cli ^2`)
- node_modules exist (bun.lock present)

## Risk

- First Rust compile will take 3-5 minutes (downloads + compiles all crate dependencies)
- Sidecar build (`bun run build --single`) compiles the full opencode CLI into a single binary - may take 1-2 minutes
- If `cargo` can't find system frameworks, may need Xcode CLI tools (`xcode-select --install`)
