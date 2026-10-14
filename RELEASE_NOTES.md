# Release Notes - v0.1.14

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.14** makes the clickable task actions match the Standard (GFM) template, which has no in-progress state.

---

## 🛠️ What's Fixed

### ✅ Task Actions Under Standard (GFM)
- **No More Start:** With `mdTaskView.stateTemplate` set to **Standard (GFM)**, tasks no longer offer `Start`, `Continue` or `Mark not started`. Previously `Start` wrote `[/]`, which GFM does not define and the tree showed as an unknown custom state.
- **Two Actions Only:**
  - **Unchecked `[ ]`:** `Mark done`
  - **Checked `[x]`:** `Mark not done`
  - **Any other marker (e.g. a leftover `[/]`):** `Mark done | Mark not done`
- **Everywhere:** The editor actions and each task's right-click menu in the tree view follow the same rule. The `Start Task` command changes nothing under Standard (GFM) and says why.

### 💎 Other Templates Are Unchanged
- **Obsidian Tasks** keeps the full set: `Start | Mark done`, `Continue | Mark done | Mark not started`, and `Mark not done`.
- **Custom templates** offer `Start` and `Continue` when they define an in-progress state (a state with id `in_progress`, or one mapped to `[/]`).

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.14.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.14.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.14.vsix` file.
