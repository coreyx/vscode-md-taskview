# Release Notes - v0.1.13

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.13** adds clickable actions above each task in the editor and a rotating spinner for tasks that are in progress.

---

## 🛠️ What's New

### ▶️ Clickable Task Actions
- **Actions Above Each Task:** When a task file is open in the text editor, each task shows clickable actions matched to its state:
  - **Not started:** `Start | Mark done`
  - **Started:** `Continue | Mark done | Mark not started`
  - **Done:** `Mark not done`
- **What They Do:** **Start** marks the task in progress (`[/]`), **Continue** opens the task in the editor, and the mark actions change only the task's checkbox.
- **Also in the Tree View:** The same actions are in each task's right-click menu, and are available as commands (e.g. `Start Task`, `Mark Task Done`) that act on the task under the cursor.
- **Optional:** Turn the editor actions off with `mdTaskView.showTaskActions`. They are CodeLens, so they need `editor.codeLens` enabled and do not appear in Markdown Preview.

### 🔄 In-Progress Spinner
- **Rotating Spinner:** In-progress tasks display a rotating spinner in the tree view.
- **Respects Reduced Motion:** A static circular arrow icon is shown instead when `mdTaskView.animateTaskIcons` is disabled or VS Code's `accessibility.reducedMotion` is `on`.
- **Custom Templates:** Any state in a custom `*.jsonc` template can opt in with `"animatedIcon": "loading~spin"`.

> **Note:** The in-progress state and its spinner belong to the **Obsidian Tasks** template (`mdTaskView.stateTemplate`). Under **Standard (GFM)**, which has only `[ ]` and `[x]`, a started task (`[/]`) appears as a custom state.

### 🧰 Development
- **pnpm:** The project now builds with pnpm (`pnpm install`, `pnpm run package:vsix`).

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.13.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.13.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.13.vsix` file.
