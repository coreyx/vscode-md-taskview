# System Requirements Specification: VS Code Markdown Task View

This document defines the formal software requirements for `vscode-md-taskview`. All requirements follow the **EARS (Easy Approach to Requirements Syntax)** methodology, containing:
1. **Name & Identifier:** Unique requirement ID and descriptive title.
2. **User Story:** Role, capability, and benefit narrative.
3. **EARS Statement:** Formal requirements statement written in one of the five EARS patterns:
   - **Ubiquitous:** *The [system] shall [response].*
   - **Event-driven:** *When [trigger], the [system] shall [response].*
   - **State-driven:** *While [state], the [system] shall [response].*
   - **Unwanted behavior:** *If [unwanted condition], then the [system] shall [response].*
   - **Optional feature:** *Where [feature flag/setting enabled], the [system] shall [response].*
4. **Acceptance Criteria:** Verifiable acceptance tests numbered with subsection numbering.

---

## 1. Spec Discovery & Configuration

### Requirement 1.1: Spec Directory Discovery (`REQ-DISC-01`)
- **User Story:** As a developer using spec-driven development, I want the extension to automatically discover all spec folders in my workspace so that I do not need to register individual features manually.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the workspace is opened or workspace folders change, the Extension shall scan the workspace directory tree for folders matching the configured spec pattern.
- **Acceptance Criteria:**
  - **1.1.1:** The Extension shall resolve directories matching the glob pattern in `mdTaskView.specPathPattern` (default: `spec/*`).
  - **1.1.2:** The Extension shall extract the basename of each matching folder to serve as the default spec group identifier.
  - **1.1.3:** The Extension shall discover matching spec directories across all active folders in a multi-root workspace.

### Requirement 1.2: Task File Detection (`REQ-DISC-02`)
- **User Story:** As a developer, I want the extension to locate the target task markdown file inside each spec directory so that only designated task lists are tracked.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When a valid spec directory is detected, the Extension shall check for the existence of the file specified by `mdTaskView.taskFileName`.
- **Acceptance Criteria:**
  - **1.2.1:** The Extension shall look for the file named by `mdTaskView.taskFileName` (default: `tasks.md`) directly within each discovered spec directory.
  - **1.2.2:** The Extension shall associate the discovered file path with its parent spec group.
  - **1.2.3:** If a spec directory does not contain the designated task file, the Extension shall ignore the directory without throwing an error.

### Requirement 1.3: User Configuration Reactivity (`REQ-CONF-01`)
- **User Story:** As a developer with custom folder naming conventions, I want changes to extension settings to take immediate effect so that I can customize my environment without restarting VS Code.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user modifies any `mdTaskView.*` configuration setting, the Extension shall reload the configuration and trigger a complete rescan and re-render of the task tree.
- **Acceptance Criteria:**
  - **1.3.1:** The Extension shall listen to `vscode.workspace.onDidChangeConfiguration` filtered to the `mdTaskView` section.
  - **1.3.2:** The Extension shall re-evaluate `specPathPattern`, `taskFileName`, `includePatterns`, and `excludePatterns` upon configuration modification.
  - **1.3.3:** The Extension shall refresh the TreeView within 300ms of a configuration change event.

---

## 2. Markdown AST Parsing & Document Hierarchy

### Requirement 2.1: Heading Level Parsing (`REQ-PARSE-01`)
- **User Story:** As a developer organizing specifications with hierarchical headings, I want the extension to parse `#`, `##`, `###`, etc. so that my task tree reflects the document outline.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall parse Markdown headings from level 1 (`#`) through level 6 (`######`) into a parent-child branch hierarchy based on relative heading depth.
- **Acceptance Criteria:**
  - **2.1.1:** The Extension shall record the text label, heading level (1–6), line number, and character range for each parsed heading.
  - **2.1.2:** A heading with level $N+1$ following level $N$ shall be constructed as a child node of level $N$.
  - **2.1.3:** A heading with level $\le N$ following level $N$ shall close the preceding branch and attach to the appropriate ancestor node.

### Requirement 2.2: Checklist Item Extraction (`REQ-PARSE-02`)
- **User Story:** As a developer writing task lists, I want standard markdown checklist items extracted with their text and bracket character so that my tasks are tracked accurately.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall extract checklist items formatted as `- [<char>] <text>` or `* [<char>] <text>` and assign them to the most immediate preceding heading.
- **Acceptance Criteria:**
  - **2.2.1:** The Extension shall capture the bracket character `<char>`, the clean task text, the zero-indexed line number, and the exact column range of the bracket character.
  - **2.2.2:** Checklist items occurring before the first heading in a document shall be assigned directly to the spec group root node.
  - **2.2.3:** Standard checklist symbols `[ ]`, `[x]`, and `[X]` shall be recognized and mapped to pending and completed states respectively.

### Requirement 2.3: Nested Sub-Task Hierarchy (`REQ-PARSE-03`)
- **User Story:** As a developer breaking complex tasks into sub-tasks, I want indented checklist items to nest under their parent checklist item so that sub-tasks stay organized.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall parse indented checklist items as child nodes of the nearest preceding checklist item with a lower indentation level.
- **Acceptance Criteria:**
  - **2.3.1:** The Extension shall calculate indentation levels based on tab characters or standard two/four-space indents.
  - **2.3.2:** Sub-tasks shall appear as expandable child nodes under the parent task in the TreeView.
  - **2.3.3:** Completion of child tasks shall contribute to the completion tally of the parent task and parent heading.

---

## 3. Sidebar TreeView & Grouping

### Requirement 3.1: Spec Folder Group Rendering (`REQ-VIEW-01`)
- **User Story:** As a developer, I want all tasks grouped under their respective spec folder names in the sidebar so that I can distinguish tasks across different features.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall render each discovered spec directory as a top-level expandable/collapsible root node in the TreeView.
- **Acceptance Criteria:**
  - **3.1.1:** The root group label shall display the spec folder name.
  - **3.1.2:** The root group shall use a dedicated folder/spec icon (`codicon:folder` or `codicon:package`).
  - **3.1.3:** Expanding a spec group node shall reveal its immediate child headings and any top-level unheaded checklist items.

### Requirement 3.2: Heading Branch Rendering (`REQ-VIEW-02`)
- **User Story:** As a developer, I want to expand and collapse heading sections in the tree view so that I can focus on my active work area.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall render headings as expandable/collapsible branch nodes preserving their hierarchical depth.
- **Acceptance Criteria:**
  - **3.2.1:** Headings containing child headings or checklist items shall default to an expanded state (configurable to collapsed).
  - **3.2.2:** Headings with no checklist items and no child headings containing checklist items shall either be omitted or displayed as empty leaf nodes based on configuration.
  - **3.2.3:** Heading nodes shall display a section icon (`codicon:symbol-class` or `codicon:bookmark`).

### Requirement 3.3: Progress Statistics & Aggregate Counts (`REQ-VIEW-03`)
- **User Story:** As a developer or lead, I want to see completion counts on groups and headings so that I can assess progress at a glance.
- **EARS Pattern:** *Where [feature enabled]*
- **EARS Statement:** Where `mdTaskView.showProgressCount` is true, the Extension shall display completion statistics in the description or badge of each group and heading node.
- **Acceptance Criteria:**
  - **3.3.1:** The count shall be formatted as `(<completed>/<total>)` (e.g., `(3/5)`).
  - **3.3.2:** The spec group count shall represent the recursive total of all completed tasks divided by all countable tasks in that spec file.
  - **3.3.3:** The heading count shall represent the recursive total of all completed tasks under that heading branch.

---

## 4. Jump-to-Source Navigation

### Requirement 4.1: Task Node Jump Navigation (`REQ-NAV-01`)
- **User Story:** As a developer, I want clicking a task in the tree view to open the markdown file and jump directly to that task line so that I can edit or read the context immediately.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user clicks or presses Enter on a task node in the TreeView, the Extension shall open the corresponding `tasks.md` file in the active editor column and move the cursor to that line.
- **Acceptance Criteria:**
  - **4.1.1:** The editor shall scroll so that the selected task line is centered in the viewport.
  - **4.1.2:** The entire task line shall be momentarily selected or highlighted.
  - **4.1.3:** Navigation shall function whether the file is already open in an editor tab or closed on disk.

### Requirement 4.2: Heading Node Jump Navigation (`REQ-NAV-02`)
- **User Story:** As a developer, I want clicking a heading in the tree view to navigate to that heading in the markdown document so that I can quickly jump between sections.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user clicks on a heading node in the TreeView, the Extension shall open the corresponding `tasks.md` file and scroll the editor to that heading line.
- **Acceptance Criteria:**
  - **4.2.1:** The editor shall position the cursor at column 0 of the target heading line.
  - **4.2.2:** Clicking the expand/collapse chevron shall toggle node expansion without opening the editor.

---

## 5. Filesystem Watching & Real-Time Disk Sync

### Requirement 5.1: Live External Disk Synchronization (`REQ-SYNC-01`)
- **User Story:** As a developer working with external tools and git branches, I want the tree view to always reflect the state on disk so that external edits appear immediately without manual refresh.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When a `tasks.md` file matching the spec pattern is created, modified, or deleted on disk, the Extension shall update the TreeView to reflect the on-disk state.
- **Acceptance Criteria:**
  - **5.1.1:** The Extension shall maintain an active `FileSystemWatcher` targeting `{specPathPattern}/{taskFileName}`.
  - **5.1.2:** When a watched file is modified externally (e.g., git branch checkout, AI generator), the TreeView shall refresh automatically within 250ms.
  - **5.1.3:** When a spec folder or `tasks.md` file is deleted, the corresponding spec group shall be removed from the TreeView immediately.
  - **5.1.4:** When a new spec folder containing `tasks.md` is created, the new group shall appear in the TreeView immediately.

### Requirement 5.2: Active Editor Buffer Synchronization (`REQ-SYNC-02`)
- **User Story:** As a developer editing a `tasks.md` file in the editor, I want the tree view to update as I type so that the sidebar is never stale compared to what I am writing.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When an open `tasks.md` text document is modified in the VS Code editor, the Extension shall re-parse the document buffer and refresh the corresponding spec tree.
- **Acceptance Criteria:**
  - **5.2.1:** The Extension shall listen to `vscode.workspace.onDidChangeTextDocument`.
  - **5.2.2:** Modifications in active memory buffers shall reflect in the TreeView even if the document has not yet been saved to disk.
  - **5.2.3:** Buffer parsing shall be debounced by 150ms to ensure typing remains fluid without UI stutter.

### Requirement 5.3: Incremental Spec File Invalidation (`REQ-SYNC-03`)
- **User Story:** As a developer working in a large repository with many specs, I want updates to only re-parse the affected file so that editor performance remains lightning fast.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When a specific `tasks.md` file triggers a change event, the Extension shall invalidate and re-parse only that file's sub-tree while retaining all other spec trees.
- **Acceptance Criteria:**
  - **5.3.1:** Unmodified spec groups shall not be re-parsed or reconstructed.
  - **5.3.2:** Re-parsing a 2,000-line markdown file shall complete in under 20ms on modern hardware.

---

## 6. In-Place State Toggling & Non-Destructive Editing

### Requirement 6.1: Direct State Toggle Execution (`REQ-EDIT-01`)
- **User Story:** As a developer, I want to toggle a task's state directly from the sidebar so that I don't have to navigate to the file and manually edit the brackets.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user clicks the status toggle action on a task tree item, the Extension shall advance the task state to its designated `nextState`.
- **Acceptance Criteria:**
  - **6.1.1:** Clicking a pending task (`[ ]`) shall advance it to completed (`[x]`) in standard mode, or to in-progress (`[/]`) in Obsidian Tasks mode.
  - **6.1.2:** The status icon and styling in the TreeView shall update immediately to reflect the new state.

### Requirement 6.2: Surgical Non-Destructive Text Modification (`REQ-EDIT-02`)
- **User Story:** As a developer committing clean git diffs, I want state changes to only modify the character inside the bracket so that formatting, comments, and whitespace are preserved.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall perform text replacements using `vscode.workspace.applyEdit` modifying strictly the single character between `[` and `]`.
- **Acceptance Criteria:**
  - **6.2.1:** The edit range shall span exactly the single character between the opening `[` and closing `]`.
  - **6.2.2:** Leading list markers (`- `, `* `), indentation, line breaks (`\n` / `\r\n`), and task description text shall remain completely untouched.
  - **6.2.3:** If the file is open in an editor with unsaved changes, the edit shall apply to the active buffer safely without file reload conflicts.

### Requirement 6.3: Undo/Redo Stack Integration (`REQ-EDIT-03`)
- **User Story:** As a developer who accidentally toggles a task, I want to press `Ctrl+Z` in the editor to undo the toggle so that I have complete control over my file history.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall record all in-place state toggles in the standard VS Code undo/redo history.
- **Acceptance Criteria:**
  - **6.3.1:** Triggering `Undo` (`Ctrl+Z` / `Cmd+Z`) while the file is active shall restore the previous task state.
  - **6.3.2:** The TreeView shall synchronize and revert its visual state upon undo.

---

## 7. Visual Styling & Iconography

### Requirement 7.1: Green Circle Done Indicator (`REQ-STYLE-01`)
- **User Story:** As a developer scanning the task list, I want completed tasks to display a prominent green circle icon so that finished work is immediately distinguishable.
- **EARS Pattern:** *State-driven*
- **EARS Statement:** While a task is in the completed state, the Extension shall render the tree item with a solid green circle check icon.
- **Acceptance Criteria:**
  - **7.1.1:** The icon shall use `codicon:pass-filled` tinted with the theme color `charts.green` or a custom green SVG asset.
  - **7.1.2:** The icon shall maintain clear visibility and color contrast in both dark and light VS Code themes.

### Requirement 7.2: Crossed-Out (Strikethrough) Completed Labels (`REQ-STYLE-02`)
- **User Story:** As a developer, I want completed tasks to be crossed out with strikethrough text so that I can visually filter out finished work.
- **EARS Pattern:** *Where [feature enabled]*
- **EARS Statement:** Where `mdTaskView.strikeThroughCompleted` is true, the Extension shall render the label of completed and cancelled tasks with strikethrough formatting and dimmed contrast.
- **Acceptance Criteria:**
  - **7.2.1:** Completed tasks (`[x]`) shall display with strikethrough text formatting.
  - **7.2.2:** Cancelled tasks (`[-]`) shall display with strikethrough text formatting.
  - **7.2.3:** When `strikeThroughCompleted` is set to false, task labels shall render in standard font formatting regardless of completion state.

### Requirement 7.3: Pending & Neutral Task Indicators (`REQ-STYLE-03`)
- **User Story:** As a developer, I want pending tasks to have a clean, non-distracting visual style so that active tasks remain the focus.
- **EARS Pattern:** *State-driven*
- **EARS Statement:** While a task is in the pending (`[ ]`) state, the Extension shall render the tree item with a neutral circle outline icon and standard foreground text.
- **Acceptance Criteria:**
  - **7.3.1:** The pending icon shall use `codicon:circle-large-outline` or `codicon:circle-outline`.
  - **7.3.2:** The text label shall use the standard theme editor foreground color without strikethrough or dimming.

---

## 8. State Template System & Obsidian Tasks Compatibility (`*.jsonc`)

### Requirement 8.1: Selectable State Template Engine (`REQ-TMPL-01`)
- **User Story:** As a developer using specialized task conventions, I want to select a state template from a dropdown so that the extension recognizes my custom checklist characters.
- **EARS Pattern:** *Ubiquitous*
- **EARS Statement:** The Extension shall load and evaluate task states using the active template specified by `mdTaskView.stateTemplate`.
- **Acceptance Criteria:**
  - **8.1.1:** The configuration `mdTaskView.stateTemplate` shall offer selectable options: `"Standard (GFM)"`, `"Obsidian Tasks"`, and `"Custom"`.
  - **8.1.2:** Switching templates shall immediately re-parse all active spec trees and update all task icons and labels.

### Requirement 8.2: Obsidian Tasks Mode States (`REQ-TMPL-02`)
- **User Story:** As an Obsidian user working inside VS Code, I want full support for Obsidian Tasks syntax so that my multi-state task lists work seamlessly across both editors.
- **EARS Pattern:** *Where [feature enabled]*
- **EARS Statement:** Where the active template is set to `"Obsidian Tasks"`, the Extension shall recognize and render the six standard Obsidian task states.
- **Acceptance Criteria:**
  - **8.2.1:** `- [ ]` shall map to `Not Started` with a neutral hollow circle icon.
  - **8.2.2:** `- [/]` shall map to `In Progress` with an amber half-circle / sync icon (`codicon:sync` / amber color).
  - **8.2.3:** `- [x]` and `- [X]` shall map to `Done` with a green circle icon and strikethrough text.
  - **8.2.4:** `- [-]` shall map to `Cancelled` with a muted circle-slash icon and strikethrough text.
  - **8.2.5:** `- [?]` shall map to `Needs Clarification` with a purple/cyan question mark circle icon.
  - **8.2.6:** `- [!]` shall map to `Important` with a red exclamation indicator.
  - **8.2.7:** Only `Done` (`[x]`) shall increment the completion count in aggregate progress statistics.

### Requirement 8.3: Custom `*.jsonc` Template Loading & Validation (`REQ-TMPL-03`)
- **User Story:** As a developer with unique team conventions, I want to define custom states in a commented JSONC file so that I can configure arbitrary characters and icons.
- **EARS Pattern:** *Where [feature enabled]*
- **EARS Statement:** Where `mdTaskView.stateTemplate` is `"Custom"`, the Extension shall read and validate the template file specified by `mdTaskView.customTemplatePath`.
- **Acceptance Criteria:**
  - **8.3.1:** The Extension shall parse `*.jsonc` files containing standard JSON, trailing commas, and single/multi-line comments.
  - **8.3.2:** The schema shall validate the presence of `char`, `id`, `label`, `icon`, `strikethrough`, `countsAsCompleted`, and `nextState` properties for each defined state.
  - **8.3.3:** If the custom template file is invalid or missing, the Extension shall display a warning notification and fallback gracefully to `Standard (GFM)`.

### Requirement 8.4: Multi-State Cycling & Context Menu (`REQ-TMPL-04`)
- **User Story:** As a developer, I want to cycle through states with single clicks or pick an explicit state from a context menu so that updating states is effortless.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user right-clicks a task item in the TreeView, the Extension shall display a "Set Task State" context submenu listing all available states defined in the active template.
- **Acceptance Criteria:**
  - **8.4.1:** Selecting a state from the context menu shall mutate the task file to the selected state's character.
  - **8.4.2:** Clicking the inline toggle button shall advance the task state according to the `nextState` transition rule defined in the active template.

### Requirement 8.5: Fallback Handling for Unmapped Characters (`REQ-TMPL-05`)
- **User Story:** As a developer with legacy or third-party task characters in my markdown, I want the extension to handle unknown characters without failing or corrupting my file.
- **EARS Pattern:** *Unwanted behavior*
- **EARS Statement:** If a checklist bracket contains a character not defined in the active template, then the Extension shall render the item with a generic unmapped icon and preserve the character unmodified during all mutations.
- **Acceptance Criteria:**
  - **8.5.1:** An item with an unknown symbol (e.g., `- [>] test`) shall render with a generic bullet icon (`codicon:circle-small-filled`).
  - **8.5.2:** Unknown items shall not count toward completed progress tallies.
  - **8.5.3:** No parsing error or exception shall be thrown.

---

## 9. View Controls, Filtering & Ergonomics

### Requirement 9.1: Filter Completed Tasks (`REQ-CTRL-01`)
- **User Story:** As a developer focusing on remaining work, I want to toggle a filter button to hide completed tasks so that only pending items are visible.
- **EARS Pattern:** *Where [feature enabled]*
- **EARS Statement:** Where the "Filter Completed Tasks" toggle is active, the Extension shall omit completed and cancelled tasks from the TreeView.
- **Acceptance Criteria:**
  - **9.1.1:** The view title bar shall feature a filter icon button (`codicon:filter`).
  - **9.1.2:** Toggling the filter shall hide all tasks where `countsAsCompleted` is true or state is cancelled.
  - **9.1.3:** Headings whose descendant tasks are all filtered out shall be hidden from the tree.
  - **9.1.4:** The toggle state shall persist across VS Code sessions via workspace memento state.

### Requirement 9.2: Collapse All & Refresh Controls (`REQ-CTRL-02`)
- **User Story:** As a developer navigating multiple specs, I want Collapse All and Refresh buttons in the view title so that I can manage tree density easily.
- **EARS Pattern:** *Event-driven*
- **EARS Statement:** When the user clicks the "Collapse All" or "Refresh" action buttons in the view title, the Extension shall execute the corresponding tree command.
- **Acceptance Criteria:**
  - **9.2.1:** Clicking "Collapse All" (`codicon:collapse-all`) shall collapse all open headings and spec groups.
  - **9.2.2:** Clicking "Refresh" (`codicon:refresh`) shall force an immediate re-scan and full re-parse of all workspace spec files.

### Requirement 9.3: Empty States & Welcome Guidance (`REQ-CTRL-03`)
- **User Story:** As a new user opening a project without a `./spec` directory, I want helpful welcome guidance so that I understand how to get started.
- **EARS Pattern:** *Unwanted behavior*
- **EARS Statement:** If no matching spec directories or task files are detected in the workspace, then the Extension shall display a welcome view with instructions and setup actions.
- **Acceptance Criteria:**
  - **9.3.1:** The welcome view shall display clear text: *"No specification task files found matching `./spec/*/tasks.md`."*
  - **9.3.2:** The view shall include a primary action button: `[Create Sample Spec]` which creates `./spec/example/tasks.md` with demo headings and tasks.
  - **9.3.3:** The view shall include a secondary action button: `[Open Extension Settings]` navigating directly to `mdTaskView` configuration.

---

## 10. Robustness & Error Handling

### Requirement 10.1: Malformed Markdown Resiliency (`REQ-ERR-01`)
- **User Story:** As a developer who occasionally writes malformed markdown while drafting, I want the extension to remain stable so that a typo never crashes the sidebar view.
- **EARS Pattern:** *Unwanted behavior*
- **EARS Statement:** If a line in `tasks.md` contains invalid syntax or incomplete brackets, then the Extension shall skip that line and continue parsing all remaining valid headings and tasks.
- **Acceptance Criteria:**
  - **10.1.1:** Unclosed brackets (e.g., `- [ task`) or empty list items shall be ignored without throwing errors.
  - **10.1.2:** Valid tasks occurring after a malformed line shall be parsed and rendered normally.

### Requirement 10.2: File Lock & Concurrency Safety (`REQ-ERR-02`)
- **User Story:** As a developer running build tools or git commands that touch files simultaneously, I want the extension to handle locked files gracefully without data loss.
- **EARS Pattern:** *Unwanted behavior*
- **EARS Statement:** If a `tasks.md` file is locked or temporarily unavailable during a write operation, then the Extension shall cancel the edit and display a non-blocking error notification.
- **Acceptance Criteria:**
  - **10.2.1:** The Extension shall catch file access and permission errors during `applyEdit`.
  - **10.2.2:** An informative error notification shall alert the user: *"Unable to update task: file is locked or read-only."*
  - **10.2.3:** The TreeView shall not corrupt its internal representation or alter other files.
