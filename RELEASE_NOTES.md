# Release Notes - v0.1.2

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.2** resolves a critical production bundling issue that prevented the extension from activating and caused command registration failures.

---

## 🛠️ Fixes & Improvements

### 1. Esbuild Module Bundling Fix for `jsonc-parser`
- **Issue:** When bundling for production with `esbuild`, `jsonc-parser` was being loaded via its UMD entry point (`lib/umd/main.js`). This entry point wrapped its definition inside an IIFE that shadowed Node's `require`, causing internal dependency `require('./impl/format')` to remain dynamic and fail at runtime with `Cannot find module './impl/format'`.
- **Impact:** Extension activation threw an unhandled error upon launching VS Code, resulting in:
  - Sidebar TreeView failing to initialize (staying stuck on the empty welcome view).
  - Commands not registering (`command 'mdTaskView.refresh' not found`, `command 'mdTaskView.toggleFilterCompleted' not found`).
  - Welcome view actions ("Create Sample Spec", "Open Settings") failing to execute.
- **Fix:** Configured `mainFields: ['module', 'main']` in `esbuild.js` to ensure `esbuild` selects the ESM distribution of dependencies (`jsonc-parser/lib/esm/main.js`), enabling complete inline bundle resolution with zero external relative runtime requires.

### 2. Extension Activation & Command Registration Verified
- Validated end-to-end activation and tree provider initialization with all 13 extension commands properly bound to the command registry on startup.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.2.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.2.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.2.vsix` file.
