# Release Notes - v0.1.10

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.10** preserves tree selection and focus across expand and collapse toggles, allowing continuous expand/collapse interaction without losing the active container level.

---

## 🛠️ What's New

### Selection & Focus Preservation on Expand / Collapse
- **Persistent Focus Tracking:** The active node is tracked across toolbar button interactions and tree re-renders so clicking the toolbar toggle button multiple times in succession retains the user's targeted level.
- **Automatic Tree Reveal:** After executing an expand, collapse, or toggle action, the tree view automatically reveals and re-focuses the targeted node (`treeView.reveal(target, { select: true, focus: true, expand: false })`).
- **Seamless Repeated Toggling:** Users can now click the expand/collapse toggle button back and forth to collapse and re-expand contained milestones or tasks without having to manually re-select the heading in the tree view between clicks.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.10.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.10.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.10.vsix` file.
