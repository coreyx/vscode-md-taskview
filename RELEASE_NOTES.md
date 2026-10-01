# Release Notes - v0.1.7

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.7** introduces a settings gear icon and an interactive expand/collapse all toggle to the view title toolbar.

---

## 🛠️ What's New

### 1. Settings Gear Icon in View Title Bar
- Added a dedicated settings gear action button (`$(gear)`) to the Markdown Tasks TreeView title bar.
- Clicking the gear icon opens VS Code's Settings UI pre-filtered directly to `@ext:coreyx.vscode-md-taskview` / `mdTaskView` configuration options.

### 2. Dual-State Expand / Collapse All Toggle Button
- Replaced the static native collapse button with an interactive two-way toggle button (`$(collapse-all)` / `$(expand-all)`).
- **Collapse All:** Collapses all spec groups, milestone headings, and parent tasks across the entire view, seamlessly flipping the toolbar action icon to "Expand All".
- **Expand All:** Restores all groups, headings, and parent tasks to their expanded state, flipping the toolbar action icon back to "Collapse All".
- **Dynamic Tree ID Versioning:** Utilizes generation versioning (`id#v<version>`) so VS Code's internal TreeWidget cache updates node expansion immediately upon clicking the toggle button.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.7.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.7.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.7.vsix` file.
