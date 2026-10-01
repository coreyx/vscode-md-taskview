# Release Notes - v0.1.1

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.1** addresses critical extension lifecycle activation fixes, welcome view button handling, and enhanced spec folder discovery.

---

## 🛠️ Fixes & Improvements

### 1. View Activation Lifecycle & Welcome Actions
- **Issue:** Previously, `activationEvents` only specified `onStartupFinished`, preventing the extension from activating when opening the sidebar view or clicking welcome view buttons.
- **Fix:** Added `onView:mdTaskView.tasksView`, `onCommand:mdTaskView.createSampleSpec`, and `onCommand:mdTaskView.openSettings` to `activationEvents`. The extension now activates immediately whenever the sidebar is opened or action buttons are clicked.

### 2. Spec Folder Discovery for Nested & Direct Specs
- **Issue:** Specs located in nested folders (such as `./spec/vscode-md-taskview/tasks.md`) or directly in `./spec/tasks.md` could fail to match depending on workspace search index timing.
- **Fix:** Switched to direct `fast-glob` filesystem discovery with `vscode.workspace.findFiles` fallback. The scanner now simultaneously detects:
  - `spec/*/tasks.md` (e.g. `spec/vscode-md-taskview/tasks.md`)
  - `spec/tasks.md` (direct root spec)
  - `spec/**/tasks.md` (deeply nested specs)

### 3. "Create Sample Spec" Button Fix
- **Issue:** Clicking "Create Sample Spec" in the welcome view had no effect if the extension was not yet active.
- **Fix:** Wired immediate command activation and refreshed the TreeView automatically upon file creation.

### 4. "Open Settings" Direct Navigation
- **Issue:** "Open Settings" opened the general VS Code settings page without filtering to the extension's configuration options.
- **Fix:** Added a dedicated `mdTaskView.openSettings` command that opens the Settings editor and filters directly to `@ext:coreyx.vscode-md-taskview`.

### 5. Filesystem Watcher Broadening
- Broadened the live filesystem watcher pattern to monitor all task files across the entire spec directory tree.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.1.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.1.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.1.vsix` file.
