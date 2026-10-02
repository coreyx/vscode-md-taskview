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
  - **Filter Completed Tasks:** Toggle button (`$(filter)`) to instantly hide finished work.
  - **Refresh:** One-click re-scan and synchronization (`$(refresh)`) with files on disk.
  - **Expand / Collapse All Toggle & Section Scoping:** Dual-state action button (`$(collapse-all)` / `$(expand-all)`) in the view title bar that automatically limits expand/collapse to the currently focused level/section when an item is selected, and operates globally when nothing is selected.
  - **Section Expand / Collapse Context Menu:** Right-click any spec group, milestone heading, or task item to select **"Expand All in Section"** or **"Collapse All in Section"**.
  - **Settings Gear:** Quick access (`$(gear)`) to all Markdown Tasks settings directly from the view title bar.
  - **Clean Markdown Display:** Automatically strips bold (`**`, `__`) and italic (`*`, `_`) syntax from labels in the tree view while preserving `snake_case` identifiers.
  - **Milestone Progress Badging:** Heading icons dynamically switch to a solid green bookmark when all nested tasks are completed.
  - **Flexible Jump-to-Source:** Clicking any milestone or task navigates to the source location, respecting your preferred editor mode (Text Editor or Markdown Preview).

---

## 📦 Installation

### Option 1: Install from VSIX (Recommended for daily use)

You can package and install the extension directly from the repository:

1. **Build and package the `.vsix` file:**
   ```bash
   npm install
   npx @vscode/vsce package
   ```
2. **Install into VS Code:**
   - **Via Terminal / CLI:**
     ```bash
     code --install-extension vscode-md-taskview-0.1.9.vsix
     ```
   - **Via VS Code Interface:**
     1. Open the **Extensions View** (`Ctrl+Shift+X` on Windows/Linux, `Cmd+Shift+X` on macOS).
     2. Click the **`...` (Views and More Actions)** menu icon at the top right of the Extensions panel.
     3. Select **Install from VSIX...**
     4. Select the generated `vscode-md-taskview-0.1.9.vsix` file.

### Option 2: Run in Development Mode (F5)

To test or develop the extension live:

1. Clone and open the repository in VS Code:
   ```bash
   git clone https://github.com/coreyx/vscode-md-taskview.git
   cd vscode-md-taskview
   npm install
   ```
2. Press **`F5`** (or go to `Run` → `Start Debugging`).
3. A new **Extension Development Host** VS Code window will launch with the extension running and ready to test!

### Option 3: Local Symlink Installation

To run your local build directly in your regular VS Code without packaging:

- **Windows (PowerShell as Administrator or with Developer Mode):**
  ```powershell
  New-Item -ItemType SymbolicLink -Path "$HOME\.vscode\extensions\coreyx.vscode-md-taskview-0.1.9" -Target (Get-Location)
  ```
- **macOS / Linux:**
  ```bash
  ln -s "$(pwd)" "$HOME/.vscode/extensions/coreyx.vscode-md-taskview-0.1.9"
  ```
- Reload VS Code (`Ctrl+Shift+P` / `Cmd+Shift+P` → `Developer: Reload Window`).

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

## 🧭 Navigation & Editor Modes

Markdown Tasks can open your specification files in different editors depending on your workflow preferences. You can configure this via the `mdTaskView.openEditor` setting (`auto`, `textEditor`, or `preview`).

Here is how navigation behaves across the three editor modes available in VS Code:

### 1. Standard Text Editor Mode (`textEditor` or default `.md`)
* **Behavior:** Jumps directly to milestones and individual tasks with exact line centering and cursor selection.
* **How it works:** In text editor mode, the extension operates on raw file line numbers. Clicking any milestone heading or checklist item opens the file in VS Code's text editor, centers the target line, and selects it.

### 2. Markdown Preview Mode (`vscode.markdown.preview.editor` or `preview`)
* **Behavior:** Scrolls directly to milestone headings and parent milestone sections for tasks.
* **How it works:** Markdown Preview renders compiled HTML in a webview sandbox. In VS Code's built-in Markdown engine:
  * **Milestone Headings** (`#`, `##`, etc.) automatically receive DOM `id` anchors derived from their slugified titles (e.g. `<h2 id="milestone-1-project-foundation">`). Clicking a milestone scrolls the preview to that heading.
  * **Task Checklists** (`- [ ]`, `- [x]`) are rendered as plain list items (`<li class="task-list-item">`) without individual DOM `id` attributes. When clicking a task, the extension resolves its parent milestone slug and scrolls the preview to that milestone's section.
  * Already-open preview tabs are automatically re-resolved so clicking between different milestones or tasks in succession updates and scrolls the preview to the selected section.

### 3. Markdown Editor Mode (`vscode.markdown.editor`)
* **Behavior:** Opens the document at the top (scroll position `0`).
* **How it works:** "Markdown Editor" is VS Code's experimental WYSIWYG / rich-text custom editor. In VS Code's current implementation, `vscode.markdown.editor` does not support URI fragment navigation, anchor slugs, or external line scrolling commands.

### 💡 Tip: Rendered Preview + Task-Level Precision
If you want to view rendered Markdown while retaining pinpoint task-level jumping:
1. Set `"mdTaskView.openEditor": "textEditor"`.
2. Open the Markdown Preview to the side (`Ctrl+K V` on Windows/Linux or `Cmd+K V` on macOS).
3. With VS Code's default `"markdown.preview.scrollPreviewWithEditor": true`, clicking any task in **Markdown Tasks** centers the text editor on that exact task, and the side preview scrolls simultaneously in real time.

---

## ⚙️ Configuration Settings

Customize behavior via VS Code Settings (`Ctrl+,` $\rightarrow$ search `Markdown Task View`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mdTaskView.openEditor` | `enum` | `"auto"` | How to open spec files when clicking items: `"auto"` (respects `workbench.editorAssociations`), `"textEditor"` (always opens in text editor), or `"preview"` (always opens in Markdown Preview). |
| `mdTaskView.specPathPattern` | `string` | `"spec/*"` | Glob pattern or relative directory path where spec folders are located. |
| `mdTaskView.taskFileName` | `string` | `"tasks.md"` | Target file name containing tasks inside each spec folder. |
| `mdTaskView.includePatterns` | `array` | `["spec/*/tasks.md"]` | File patterns to search for markdown task lists. |
| `mdTaskView.excludePatterns` | `array` | `["**/node_modules/**", "**/dist/**", "**/.git/**"]` | File patterns to exclude from spec searching. |
| `mdTaskView.stateTemplate` | `enum` | `"Standard (GFM)"` | Active state template: `"Standard (GFM)"`, `"Obsidian Tasks"`, or `"Custom"`. |
| `mdTaskView.customTemplatePath` | `string` | `""` | Path to custom `*.jsonc` state template file (used when `stateTemplate` is `"Custom"`). |
| `mdTaskView.strikeThroughCompleted` | `boolean` | `true` | Render completed and cancelled tasks with strikethrough (crossed-out) text. |
| `mdTaskView.showProgressCount` | `boolean` | `true` | Show `(completed/total)` counts next to groups and headings. |
| `mdTaskView.autoSyncWithDisk` | `boolean` | `true` | Maintain continuous live sync with disk via filesystem watchers. |
| `mdTaskView.hideCompletedByDefault` | `boolean` | `false` | Whether to filter out completed items upon initial launch. |
| `mdTaskView.useH1AsGroupName` | `boolean` | `false` | Use the first level-1 heading in `tasks.md` as the group title instead of the folder name. |

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
