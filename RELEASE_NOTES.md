# Release Notes - v0.1.8

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.8** adds the ability to limit expand all and collapse all operations to the currently focused section/level.

---

## 🛠️ What's New

### 1. Context-Sensitive Toolbar Expand / Collapse All
- When a node (spec group, milestone heading, or parent task) is focused or selected in the TreeView, clicking the toolbar action button (`$(collapse-all)` / `$(expand-all)`) limits the operation to that focused section and its descendants.
- Other sibling sections and parent branches remain in their current state without being collapsed or expanded.
- When no node is selected, the toolbar button falls back to operating globally across all workspace spec files.

### 2. Right-Click Context Menu Actions
- Added dedicated context menu actions to the right-click menu of any tree item:
  - **"Expand All in Section"** (`$(expand-all)`): Recursively expands the right-clicked spec group, milestone heading, or parent task.
  - **"Collapse All in Section"** (`$(collapse-all)`): Recursively collapses the right-clicked spec group, milestone heading, or parent task.
- When right-clicking a leaf task, the action targets its enclosing milestone heading or parent task.

### 3. Dedicated Global Commands
- Added explicit global commands available in the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
  - `Markdown Tasks: Collapse All (Global)`
  - `Markdown Tasks: Expand All (Global)`

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.8.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.8.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.8.vsix` file.
