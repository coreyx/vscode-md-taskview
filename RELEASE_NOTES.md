# Release Notes - v0.1.9

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.9** refines the scoped expand/collapse behavior so that operations act on the level contained directly below the selected item.

---

## 🛠️ What's New

### Scoped Expand / Collapse on Contained Levels
- **Container Kept Expanded:** When selecting a container level in the tree (such as a spec group or parent heading), the selected container remains expanded while all milestones or subheadings contained directly within it are collapsed or expanded.
- **Batch Milestone Management:** You can now select a parent heading level or spec group in the tree and click Collapse All (`$(collapse-all)`) to collapse all nested milestones at once—hiding their tasks while keeping the milestone list visible. Clicking Expand All (`$(expand-all)`) expands all milestones at once to reveal all their nested tasks.
- **Smart Toggle Detection:** The toolbar toggle icon dynamically evaluates whether the contained children within the selected container are collapsed or expanded, displaying `$(expand-all)` when all contained milestones are collapsed and `$(collapse-all)` when any are expanded.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.9.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.9.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.9.vsix` file.
