# Release Notes - v0.1.0

## VS Code Markdown Task View (`vscode-md-taskview`)

We are excited to announce the initial release of **VS Code Markdown Task View** (`v0.1.0`)!

**VS Code Markdown Task View** is a lightweight, visual, and hierarchical sidebar TreeView for Visual Studio Code that bridges plain-text Markdown task specifications with native IDE task tracking.

---

## 🌟 Key Highlights

### 📂 Automatic Workspace Spec Discovery
- Scans your workspace specification folders (default: `./spec/*/tasks.md`) and groups tasks by feature or spec folder name.
- Seamlessly supports multi-root workspaces with folder name prefixing.

### 📑 Document Heading Hierarchy
- Automatically parses and mirrors Markdown heading levels (`#` through `######`) as an expandable and collapsible tree outline in the sidebar.
- Preserves context by assigning checklist items directly to their parent heading section.

### 🟢 Expressive Visual Statuses
- **Completed Tasks:** Prominent solid **green circle** check indicators (`pass-filled` tinted with `charts.green`) and **crossed-out** strikethrough labels with dimmed contrast.
- **Pending Tasks:** Clean, neutral circle outline icons.

### 🔄 Live Filesystem & Buffer Synchronization
- Built-in `FileSystemWatcher` keeps the sidebar 100% in sync with external disk changes (git branch checkouts, external editors, AI code generators).
- Listens to active in-memory editor buffers (`onDidChangeTextDocument`) with intelligent debouncing to update the tree in real time as you type.

### ⚡ Surgical In-Place State Toggling
- Click the inline action icon on any task to advance its state (`[ ]` $\rightarrow$ `[x]`).
- Modifies strictly the single character inside the brackets using `vscode.workspace.applyEdit`, preserving all surrounding whitespace, indentation, list markers, and comments.
- Fully integrated with VS Code's editor undo/redo history (`Ctrl+Z`).

### 💎 Multi-State & Obsidian Tasks Mode
- Native support for the 6 standard Obsidian Tasks states out of the box:
  - `- [ ]` Not started
  - `- [/]` In progress
  - `- [x]` Done
  - `- [-]` Cancelled
  - `- [?]` Needs clarification
  - `- [!]` Important
- Right-click any task to access the **"Set Task State"** context menu.

### 🛠️ Custom `*.jsonc` State Template System
- Define custom workflow states, characters, icons, colors, strikethrough flags, and transition sequences using commented JSON (`*.jsonc`) files.

### 🔍 Productivity Controls
- **Filter Completed Tasks:** Toggle button in the view title to instantly hide finished work.
- **Collapse All & Refresh:** One-click management of tree density.
- **Jump-to-Source:** Clicking any task or heading jumps to the exact line in the editor and centers it.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.0.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.0.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.0.vsix` file.

---

## 📄 License & Attribution

- **Author:** Corey Struzan
- **Repository:** [coreyx/vscode-md-taskview](https://github.com/coreyx/vscode-md-taskview)
- **License:** MIT License
