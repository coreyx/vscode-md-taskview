# Release Notes - v0.1.4

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.4** adds visual milestone completion indicators with a custom bundled filled bookmark icon rendered in green.

---

## 🛠️ Enhancements & Improvements

### 1. Milestone Completion Visual Indicator (Filled Bookmark SVG)
- **Feature:** Headings and milestones in the TreeView now visually reflect their completion state:
  - **Incomplete / In Progress:** Displays the standard outline bookmark icon (`bookmark`).
  - **Complete:** Automatically switches to a custom solid filled bookmark icon rendered in theme-aware vibrant green (`#73c991` for dark themes, `#2da44e` for light themes) when all countable tasks under that heading or milestone are completed (`completedCount === totalCountable`).
- **Assets:** Bundled dark and light themed SVG icons under `resources/icons/` ensuring pixel-perfect contrast across all themes and high-contrast modes.

### 2. Enhanced Milestone Tooltips
- Tooltips for heading items now display dynamic status summaries:
  - Complete state: `[Milestone Name] (Complete: X/X)`
  - In-progress state: `[Milestone Name] (X/Y completed)`

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.4.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.4.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.4.vsix` file.
