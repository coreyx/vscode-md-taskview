# VS Code Markdown Task View (`vscode-md-taskview`)

A lightweight, visual, and hierarchical sidebar TreeView for Visual Studio Code that bridges plain-text Markdown task specifications with native IDE task tracking.

Designed for modern spec-driven workflows and supercharged with **Obsidian Tasks** compatibility, this extension scans your workspace specification folders (e.g. `./spec/*`), organizes tasks cleanly under each spec name, and provides interactive tracking directly within VS Code.

---

## ✨ Features

- **📂 Automatic Spec Discovery:** Detects all `tasks.md` files located in spec directories (default: `./spec/*/tasks.md`) and groups them by feature/spec folder name.
- **📑 Document Heading Hierarchy:** Replicates Markdown heading levels (`#`, `##`, `###`) into an expandable and collapsible tree outline.
- **🟢 Rich Visual States:**
  - Completed items display a solid **green circle** indicator (`codicon:pass-filled` tinted with theme green).
  - Completed tasks are **crossed out** with strikethrough text and dimmed contrast.
  - Pending items display a clean neutral circle outline.
- **🔄 Live Filesystem Synchronization:**
  - Continuous `FileSystemWatcher` keeps the view 100% in sync with changes on disk (git operations, external tools, AI code generators).
  - Watches active in-memory editor buffers (`onDidChangeTextDocument`) with intelligent debouncing to update as you type.
- **⚡ In-Place Surgical Toggling:**
  - Click the inline toggle action to advance task state (`[ ]` $\rightarrow$ `[x]`).
  - Executes non-destructive edits on the exact bracket character without altering surrounding whitespace, indentation, or comments.
  - Fully integrated with VS Code's native undo/redo stack (`Ctrl+Z`).
- **💎 Multi-State & Obsidian Tasks Mode:**
  - Supports the 6 standard Obsidian Tasks states out of the box:
    - `- [ ]` Not started
    - `- [/]` In progress
    - `- [x]` Done
    - `- [-]` Cancelled
    - `- [?]` Needs clarification
    - `- [!]` Important
  - Right-click any task to open the **"Set Task State"** context menu.
- **🛠️ Extensible `*.jsonc` State Template System:**
  - Define custom states, characters, icons, and transition cycles using commented JSON (`*.jsonc`) files.
- **🔍 Productivity View Controls:**
  - **Filter Completed Tasks:** Toggle button to instantly hide finished work.
  - **Collapse All / Refresh:** One-click management of tree density.
  - **Jump-to-Source:** Clicking any task or heading jumps to the exact line in the editor and highlights it.

---

## 🚀 Getting Started

1. Create a `spec` folder in your workspace root, e.g.:
   ```text
   my-project/
   └── spec/
       ├── authentication/
       │   └── tasks.md
       └── billing/
           └── tasks.md
   ```
2. In your `tasks.md` file, write standard headings and checklists:
   ```markdown
   # Milestone 1: Core Setup
   ## Database
   - [x] Configure PostgreSQL connection
   - [ ] Run initial migrations

   ## API Endpoints
   - [/] POST /auth/login
   - [?] Verify OAuth redirect URLs
   - [!] Rotate production JWT secrets
   ```
3. Open the **Markdown Tasks** view container in the VS Code Activity Bar (`$(checklist)` icon) to view and interact with your tasks!

---

## ⚙️ Configuration Settings

Customize behavior via VS Code Settings (`Ctrl+,` $\rightarrow$ search `Markdown Task View`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mdTaskView.specPathPattern` | `string` | `"spec/*"` | Glob pattern or relative directory path where spec folders are located. |
| `mdTaskView.taskFileName` | `string` | `"tasks.md"` | Target file name containing tasks inside each spec folder. |
| `mdTaskView.stateTemplate` | `enum` | `"Standard (GFM)"` | Active state template: `"Standard (GFM)"`, `"Obsidian Tasks"`, or `"Custom"`. |
| `mdTaskView.customTemplatePath` | `string` | `""` | Path to custom `*.jsonc` state template file (used when `stateTemplate` is `"Custom"`). |
| `mdTaskView.strikeThroughCompleted` | `boolean` | `true` | Render completed and cancelled tasks with strikethrough (crossed-out) text. |
| `mdTaskView.showProgressCount` | `boolean` | `true` | Show `(completed/total)` counts next to groups and headings. |
| `mdTaskView.autoSyncWithDisk` | `boolean` | `true` | Maintain continuous live sync with disk via filesystem watchers. |
| `mdTaskView.hideCompletedByDefault` | `boolean` | `false` | Whether to filter out completed items upon initial launch. |

---

## 🧩 Custom State Template Example (`*.jsonc`)

To define your own custom workflow states, set `"mdTaskView.stateTemplate": "Custom"` and point `"mdTaskView.customTemplatePath": ".vscode/tasks-template.jsonc"`:

```jsonc
{
  "name": "Custom Team Workflow",
  "description": "Custom lifecycle states",
  "defaultState": " ",
  "states": [
    {
      "char": " ",
      "id": "todo",
      "label": "To Do",
      "icon": "circle-large-outline",
      "strikethrough": false,
      "countsAsCompleted": false,
      "nextState": "/"
    },
    {
      "char": "/",
      "id": "progress",
      "label": "In Progress",
      "icon": "sync",
      "color": "charts.yellow",
      "strikethrough": false,
      "countsAsCompleted": false,
      "nextState": "x"
    },
    {
      "char": "x",
      "id": "done",
      "label": "Done",
      "icon": "pass-filled",
      "color": "charts.green",
      "strikethrough": true,
      "countsAsCompleted": true,
      "nextState": " "
    }
  ]
}
```

---

## 📄 License

MIT License.
