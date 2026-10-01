# Product Definition: VS Code Markdown Task View (`vscode-md-taskview`)

## 1. Product Vision & Summary

**VS Code Markdown Task View** is a lightweight, visual, and developer-friendly extension for Visual Studio Code that bridges plain-text specification workflows with native IDE task tracking.

Designed for modern spec-driven development and enhanced with support for paradigms like **Obsidian Tasks**, this extension discovers markdown task lists stored within specification directories (e.g., `./spec/*`), organizes them cleanly by feature or spec group, and renders them in an intuitive, hierarchical tree view directly in the VS Code sidebar.

The extension guarantees continuous, real-time synchronization with on-disk markdown files via robust filesystem watchers. It provides rich visual state feedback—including crossed-out text and green circle indicators for completed tasks—and features an extensible **Task State Template System** powered by `*.jsonc` mapping files, enabling seamless support for custom states (`[/] In Progress`, `[-] Cancelled`, `[?] Clarification`, `[!] Important`, etc.).

### Core Value Proposition
- **Single Source of Truth:** Specifications and task lists remain in version-controlled plain Markdown files (`tasks.md`), directly alongside codebase artifacts.
- **Always In Sync with Disk:** Live filesystem watchers guarantee that external modifications, git operations, AI code generation, and internal editor saves reflect immediately without manual refreshes.
- **Rich Visual States:** Distinct visual representations for task lifecycles, featuring green circle check indicators and crossed-out labels for completed tasks.
- **Extensible State Template System:** Out-of-the-box support for standard GitHub-Flavored Markdown (GFM) and Obsidian Tasks, with user-definable custom state mappings via `*.jsonc` templates selectable from a dropdown.
- **Intuitive Hierarchy:** Faithfully replicates document heading levels (`#`, `##`, `###`) as nested collapsible tree nodes.

---

## 2. Target Audience & User Personas

### 2.1 Target Audience
- **Spec-Driven Developers:** Engineers following spec-first workflows, specification-driven development (SDD), and structured AI-assisted coding paradigms (e.g., Spec-Kit, Cursor rules, Antigravity workflows).
- **Obsidian & PKM Power Users:** Developers who maintain personal knowledge management vaults or project tasks formatted with Obsidian Tasks syntax directly inside VS Code.
- **Solo Developers & Small Teams:** Developers seeking lightweight task and sprint tracking directly inside git repositories without external project management overhead.

### 2.2 Key Personas

| Persona | Role | Key Pain Point | How Task View Solves It |
| :--- | :--- | :--- | :--- |
| **Alex (Spec-First Dev)** | Senior Software Engineer | Writing specs in `./spec/` with deep heading hierarchies and task checklists, but finding it tedious to scroll through multiple large `tasks.md` files to see what's done. | Provides a high-level, persistent sidebar view grouped by spec with clickable task navigation and instant visual progress. |
| **Jordan (Obsidian / Workflow Power User)** | Lead Architect | Uses Obsidian Tasks conventions (`[/]` in progress, `[?]` needs clarification, `[!]` priority) across specs and hates that standard tools treat everything as binary on/off. | Native support for multi-state task templates via selectable `*.jsonc` mappings, rendering proper icons and cycle behaviors. |
| **Morgan (AI-Assisted Builder)** | Full-Stack Builder | Generates and iterates on modular specs and tasks with AI tools; files change frequently on disk from external agents and git branches. | Live filesystem watching keeps the sidebar 100% in sync with disk state without stutters or manual refreshes. |

---

## 3. Product Principles & Design Philosophy

1. **Markdown is the Truth (No Lock-In):** All task states live in standard markdown checklist brackets (`[ ]`, `[x]`, `[/]`, etc.). The extension introduces zero proprietary frontmatter or hidden databases.
2. **Always In Sync (Disk Truth):** The sidebar tree reflects the actual state on disk at all times. Filesystem watcher events update the view seamlessly.
3. **High-Contrast, Expressive Visuals:** Completed tasks are visually distinguished with strikethrough formatting and green circle indicators; non-binary states have unmistakable visual cues.
4. **Declarative Extensibility:** Users can define and switch custom task lifecycle states using clean, commented JSON (`*.jsonc`) templates without modifying extension code.
5. **Surgical & Non-Destructive Mutations:** When toggling task states from the tree view, the extension edits only the bracket characters (`[ ]` $\rightarrow$ `[x]`), strictly preserving line numbers, whitespace, indentation, and comments.

---

## 4. Feature Requirements & Capabilities

### 4.1 Spec Discovery & Folder Grouping
- **Folder Detection:** Automatically scan the workspace for directories matching a configurable spec directory pattern (default: `./spec/*`).
- **Target File Detection:** Identify task files matching a configurable file name or pattern (default: `tasks.md`) within each detected spec directory.
  - *Example:* `./spec/authentication/tasks.md` $\rightarrow$ Spec Group: `authentication`.
  - *Example:* `./spec/billing-service/tasks.md` $\rightarrow$ Spec Group: `billing-service`.
- **Top-Level Grouping:** Each spec folder renders as a top-level expandable/collapsible root group.
- **Multi-Root Workspace Support:** Seamlessly scan and group specs across multi-root workspace folders with workspace folder prefixes where appropriate.

### 4.2 Hierarchical Heading Tree Structure
- **Heading Mirroring:** Parse Markdown headings (`#`, `##`, `###`, `####`, etc.) inside the task file and render them as an expandable/collapsible tree hierarchy.
- **Contextual Nesting:** Checklist items belong to the most immediate preceding heading.
- **Top-Level Tasks (No Heading):** Any checklist items preceding the first heading in a document are placed directly under the Spec Group root node.
- **Sub-Tasks:** Indented checklist items under parent tasks are rendered as nested child task items.

### 4.3 Task Checklist Item Rendering & Visual Styling

#### 4.3.1 Visual Styling & Indications
- **Completed Tasks:**
  - **Icon:** Solid green circle check indicator (utilizing theme color green / `pass-filled` / `circle-filled`).
  - **Label:** Strikethrough / crossed-out text (e.g., `~~Deploy to staging~~`) rendered with dimmed text contrast.
- **Pending Tasks:**
  - **Icon:** Neutral hollow circle outline (`codicon:circle-large-outline`).
  - **Label:** Standard foreground text.
- **Progress Badges & Counts:** Heading and group nodes display aggregate completion counts (e.g., `(4/7 completed)` or progress bar badge).

---

### 4.4 Task State Template System (`*.jsonc`)

To support both standard markdown checklists and advanced workflows like the **Obsidian Tasks plugin**, the extension uses a modular **Task State Template System**.

#### 4.4.1 Template Concept & Selection
- State definitions, icons, colors, strikethrough behaviors, and transition cycles are defined in `*.jsonc` files (JSON with Comments).
- Users select their active template from a dropdown setting in VS Code preferences:
  - `Standard (GFM)` (Default)
  - `Obsidian Tasks` (Pre-packaged)
  - `Custom...` (Points to a workspace or user-defined `*.jsonc` file)

#### 4.4.2 Pre-Packaged Templates

##### 1. Standard (GFM) Template
| Symbol | State Key | Label | Icon / Color | Strikethrough | Completed Count |
| :---: | :--- | :--- | :--- | :---: | :---: |
| ` ` | `pending` | Not Started | Hollow Circle (`circle-outline`) | No | No |
| `x` / `X` | `done` | Done | **Green Circle** (`pass-filled`, Green) | **Yes** | **Yes** |

##### 2. Obsidian Tasks Template
| Symbol | State Key | Label | Icon / Color | Strikethrough | Completed Count |
| :---: | :--- | :--- | :--- | :---: | :---: |
| ` ` | `not_started` | Not Started | Hollow Circle (`circle-outline`, Default) | No | No |
| `/` | `in_progress` | In Progress | Half Circle / Clock (`pie-amber` or `sync`, Amber) | No | No |
| `x` / `X` | `done` | Done | **Green Circle** (`pass-filled`, Green) | **Yes** | **Yes** |
| `-` | `cancelled` | Cancelled | Circle Slash / Cancelled (`circle-slash`, Muted) | **Yes** | No (or Excluded) |
| `?` | `clarification`| Needs Clarification | Question Mark Circle (`question`, Purple/Cyan) | No | No |
| `!` | `important` | Important | Exclamation Mark (`error`, Red) | No | No |

#### 4.4.3 Custom `*.jsonc` Template Schema
Users can author custom templates (e.g., `.vscode/md-task-templates.jsonc`) adhering to this schema:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/coreyx/vscode-md-taskview/main/schemas/task-template.schema.json",
  "name": "Obsidian Tasks",
  "description": "Supports Obsidian Tasks multi-state checklist conventions",
  "defaultState": " ",
  "states": [
    {
      "char": " ",
      "id": "not_started",
      "label": "Not Started",
      "icon": "circle-large-outline",
      "strikethrough": false,
      "countsAsCompleted": false,
      "nextState": "/"
    },
    {
      "char": "/",
      "id": "in_progress",
      "label": "In Progress",
      "icon": "loading~spin", // Or static half-filled codicon
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
      "color": "charts.green", // Green circle
      "strikethrough": true,   // Crossed out text
      "countsAsCompleted": true,
      "nextState": " "
    },
    {
      "char": "-",
      "id": "cancelled",
      "label": "Cancelled",
      "icon": "circle-slash",
      "color": "disabledForeground",
      "strikethrough": true,
      "countsAsCompleted": false,
      "nextState": " "
    },
    {
      "char": "?",
      "id": "clarification",
      "label": "Needs Clarification",
      "icon": "question",
      "color": "charts.purple",
      "strikethrough": false,
      "countsAsCompleted": false,
      "nextState": " "
    },
    {
      "char": "!",
      "id": "important",
      "label": "Important",
      "icon": "warning",
      "color": "charts.red",
      "strikethrough": false,
      "countsAsCompleted": false,
      "nextState": " "
    }
  ]
}
```

- **Graceful Fallback:** If a task line contains brackets with an unmapped character (e.g., `[>]`), the parser preserves it and treats it as an untracked/custom state with a fallback icon, ensuring no data loss or crash.

---

### 4.5 Live Updates & Continuous Filesystem Synchronization

To guarantee the view is **always in sync with what is on disk**:
- **Continuous Filesystem Watcher (`vscode.workspace.createFileSystemWatcher`):**
  - Actively monitors all `tasks.md` files matching configured spec paths.
  - Subscribes to `onDidChange`, `onDidCreate`, and `onDidDelete`.
  - Handles external updates: git checkouts, branch switches, AI coding tools modifying files, and CLI edits.
- **In-Memory Buffer Coordination:**
  - Watches active editor document dirty states (`vscode.workspace.onDidChangeTextDocument`).
  - Real-time updates reflect changes as the user types in VS Code, debounced at ~150ms.
- **Zero-Latency In-Place Toggles:**
  - When a user clicks a task status in the tree view, the extension applies the text edit via `vscode.workspace.applyEdit`.
  - The watcher or document listener captures the change and immediately updates the tree item state, fully integrated with undo/redo history (`Ctrl+Z`).

---

### 4.6 Interactions & User Journey

#### 4.6.1 Jump-to-Source Navigation
- Clicking any task node or heading node opens the corresponding markdown file in the editor and scrolls directly to that line.
- The target line in the editor is momentarily focused and highlighted.

#### 4.6.2 State Cycling & Context Menu
- **Single Click / Inline Action:** Clicking the status action button on a task advances it to the configured `nextState` (e.g., `[ ]` $\rightarrow$ `[/]` $\rightarrow$ `[x]`).
- **Context Menu:** Right-clicking any task presents a **"Set Task State"** submenu listing all states available in the active template (`Not Started`, `In Progress`, `Done`, `Cancelled`, `Clarification`, `Important`).

#### 4.6.3 Filtering & View Controls
- **Filter Completed Tasks:** Toggle button in the view title bar to show/hide completed tasks.
- **Collapse All / Expand All:** Standard VS Code view title actions.
- **Refresh:** Manual trigger to force a re-scan of the workspace.

---

## 5. User Interface & Experience (UI/UX) Specifications

### 5.1 Tree View Placement
- Primary Location: **Activity Bar** icon (custom checklist / clipboard icon) leading to a dedicated `Markdown Tasks` side panel container.
- Secondary Location: Option to embed into the standard **Explorer View Container**.

### 5.2 Tree Node Hierarchy & Visual Mockup

```text
[View Title: "MARKDOWN TASKS"] [Filter Completed] [Collapse All] [Refresh]
-------------------------------------------------------------------------
▼ 📁 authentication (4/8 completed)
  ▼ 📑 1. Core Authentication Flow (2/3)
    🟢 ~~[x] Implement JWT token signing~~                <-- Green circle & crossed out
    🔄 [/] Add refresh token rotation                     <-- In-progress icon (Amber)
    ○ [ ] Rate limiting on /auth/login                   <-- Not started (Circle outline)
  ▼ 📑 2. Third-Party OAuth (1/3)
    🟢 ~~[x] GitHub OAuth integration~~                  <-- Green circle & crossed out
    ❓ [?] Clarify Apple Developer Enterprise team ID     <-- Needs clarification (Purple)
    ❗ [!] Rotate Google OAuth production secrets        <-- Important (Red exclamation)
    🚫 ~~[-] Deprecate legacy SAML endpoint~~             <-- Cancelled (Muted & crossed out)
▶ 📁 billing-service (0/5 completed)
▶ 📁 notifications (3/3 completed)
```

### 5.3 Iconography & Visual Cues
- **Completed Tasks:** Green circle (`codicon:pass-filled` tinted with `charts.green` or custom green SVG) with crossed-out text.
- **In-Progress Tasks:** Half-filled circle or spinning synch (`codicon:sync` / `codicon:pie-amber`).
- **Needs Clarification:** Question mark inside circle (`codicon:question`).
- **Important / Blocked:** Red exclamation indicator (`codicon:error` or `codicon:warning`).
- **Cancelled Tasks:** Circle with diagonal slash (`codicon:circle-slash`), strikethrough text, muted color.

---

## 6. Configuration & Extensibility (`settings.json`)

| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `mdTaskView.specPathPattern` | `string` | `"spec/*"` | Glob pattern or relative directory path where spec folders are located. |
| `mdTaskView.taskFileName` | `string` | `"tasks.md"` | Target markdown file name containing task definitions. |
| `mdTaskView.stateTemplate` | `enum` | `"Standard (GFM)"` | Selected state template: `"Standard (GFM)"`, `"Obsidian Tasks"`, `"Custom"`. |
| `mdTaskView.customTemplatePath` | `string` | `""` | Path to custom `*.jsonc` state template file (used when `stateTemplate` is `"Custom"`). |
| `mdTaskView.strikeThroughCompleted` | `boolean` | `true` | Render completed and cancelled tasks with strikethrough (crossed-out) text. |
| `mdTaskView.completedIconColor` | `string` | `"green"` | Color style for completed items (`"green"`, `"default"`, or hex value). |
| `mdTaskView.autoSyncWithDisk` | `boolean` | `true` | Maintain continuous live sync with disk via filesystem watchers. |
| `mdTaskView.hideCompletedByDefault` | `boolean` | `false` | Whether to filter out completed items upon initial launch. |
| `mdTaskView.showProgressCount` | `boolean` | `true` | Show `(completed/total)` counts next to groups and headings. |
| `mdTaskView.useH1AsGroupName` | `boolean` | `false` | Use the first `# H1` title found in `tasks.md` as group label instead of folder name. |

---

## 7. Non-Functional Requirements

### 7.1 Performance & File Watching
- **Disk Watching Reliability:** Filesystem watchers must handle rapid batches of changes (e.g., git branch switch touching 20 spec files) without choking or freezing the UI thread.
- **Debounced Parsing:** Editor document change events debounced at 150ms; disk events debounced at 250ms.
- **AST Parsing Efficiency:** Sub-20ms parsing per `tasks.md` file using a robust markdown parser (e.g. `remark`/`mdast`).

### 7.2 Safety & State Integrity
- **Non-Destructive Text Editing:** State changes must only modify the character between brackets (`[` and `]`). No reflowing, trailing whitespace alteration, or formatting loss.
- **Cross-Platform:** Normalize file paths across Windows (`\`), macOS, and Linux (`/`).

---

## 8. Out of Scope for Version 1.0 (Future Roadmap)

- Full task creation modal (creating new task items directly from the tree view).
- Drag-and-drop task reordering between heading sections.
- Syncing directly with cloud issue trackers (GitHub Issues, Linear, Jira).
- Custom date parsing / calendar scheduling views (e.g., `@due(YYYY-MM-DD)`).

---

## 9. Next Steps & Artifact Progression

This updated document serves as the complete **Phase 1 Product Definition**. The subsequent phases are:

1. **`product.md` (Completed):** Product definition, user stories, visual specs, state templates, and live-sync design.
2. **`spec.md` & `design.md` (Phase 2):** Technical architecture, filesystem watcher lifecycle, JSONC parser/validator, AST parsing, and `TreeDataProvider` implementation.
3. **`milestones.md` & `tasks.md` (Phase 3):** Milestone breakdown, task checklist, and testing plan.
4. **Implementation & Release (Phase 4):** Project scaffolding, development, test suite, and packaging.
