# Development Tasks & Implementation Plan: VS Code Markdown Task View

This document provides the actionable task breakdown for developing `vscode-md-taskview`. Each task is a named and numbered Markdown checklist item, accompanied by concrete implementation steps and direct traceability to the acceptance criteria in `requirements.md`.

---

## Milestone 1: Project Foundation & Extension Scaffolding (MVP Part 1)

- [x] **TASK-1.1: Extension Project Scaffolding & Build Tooling**
  - **Ties to Acceptance Criteria:** `1.1.1`, `1.3.1`
  - **Concrete Steps for Implementation:**
    1. Initialize `package.json` with extension manifest metadata (`publisher`, `name`, `engines: ^1.88.0`, `categories: ["Other", "Visualization"]`).
    2. Configure `tsconfig.json` with strict mode, ES2022 target, and Node module resolution.
    3. Setup `esbuild.js` build script to bundle `src/extension.ts` into `dist/extension.js` targeting CJS with `--external:vscode`.
    4. Configure `.eslintrc.json`, `.prettierrc`, and `.gitignore`.
    5. Add npm scripts: `compile`, `watch`, `typecheck`, `lint`, and `test:unit`.

- [x] **TASK-1.2: Activity Bar Container & TreeView Registration**
  - **Ties to Acceptance Criteria:** `3.1.2`, `9.3.1`
  - **Concrete Steps for Implementation:**
    1. Define `viewsContainers.activitybar` in `package.json` with id `mdTaskView-container`, title `Markdown Tasks`, and icon `$(checklist)`.
    2. Define `views.mdTaskView-container` with view ID `mdTaskView.tasksView` and name `Markdown Tasks`.
    3. In `src/extension.ts`, create a placeholder `TaskTreeDataProvider` and register it with `vscode.window.registerTreeDataProvider('mdTaskView.tasksView', provider)`.
    4. Verify the extension activates and displays the empty view in the sidebar.

- [x] **TASK-1.3: Settings Schema Definition & Configuration Listener**
  - **Ties to Acceptance Criteria:** `1.1.1`, `1.2.1`, `1.3.1`, `1.3.2`, `1.3.3`
  - **Concrete Steps for Implementation:**
    1. Declare `contributes.configuration` in `package.json` containing:
       - `mdTaskView.specPathPattern` (default: `"spec/*"`)
       - `mdTaskView.taskFileName` (default: `"tasks.md"`)
       - `mdTaskView.includePatterns` (default: `["spec/*/tasks.md"]`)
       - `mdTaskView.excludePatterns` (default: `["**/node_modules/**", "**/dist/**"]`)
       - `mdTaskView.showProgressCount` (default: `true`)
       - `mdTaskView.strikeThroughCompleted` (default: `true`)
    2. Create `src/config/ConfigurationManager.ts` to encapsulate typed access to `vscode.workspace.getConfiguration('mdTaskView')`.
    3. Register listener for `vscode.workspace.onDidChangeConfiguration`, notifying subscribers within 300ms when `mdTaskView` keys change.

---

## Milestone 2: Spec Discovery & Markdown AST Parser (MVP Part 2)

- [x] **TASK-2.1: Spec Directory & Target File Discovery Service**
  - **Ties to Acceptance Criteria:** `1.1.1`, `1.1.2`, `1.1.3`, `1.2.1`, `1.2.2`, `1.2.3`
  - **Concrete Steps for Implementation:**
    1. Create `src/services/SpecDiscoveryService.ts`.
    2. Implement `findSpecs(workspaceFolders: vscode.WorkspaceFolder[])`:
       - Resolve glob pattern from `specPathPattern` using `vscode.workspace.findFiles` or `fast-glob`.
       - Filter folders to find those containing the file defined in `taskFileName`.
       - Extract directory basenames to establish `SpecGroup` identities.
    3. Implement support for multi-root workspaces, ensuring relative paths resolve correctly against each root folder.
    4. Write unit tests verifying spec folder detection, missing file handling, and exclusion rules.

- [x] **TASK-2.2: Markdown Heading AST Parser & Depth Hierarchy**
  - **Ties to Acceptance Criteria:** `2.1.1`, `2.1.2`, `2.1.3`, `10.1.1`, `10.1.2`
  - **Concrete Steps for Implementation:**
    1. Create `src/parser/MarkdownASTParser.ts` and define domain interfaces (`HeadingNode`, `TaskNode`, `SpecGroup`).
    2. Implement regex/line scanner or AST visitor to detect ATX headings (`#` through `######`).
    3. Record heading level (1–6), cleaned title text, 0-indexed line number, and character range.
    4. Implement tree construction algorithm: maintain a stack of active heading levels and nest children under their immediate parent level.
    5. Handle malformed heading lines gracefully without interrupting parsing of subsequent lines.

- [x] **TASK-2.3: Checklist Item & Bracket Range Extractor**
  - **Ties to Acceptance Criteria:** `2.2.1`, `2.2.2`, `2.2.3`, `8.5.1`, `8.5.3`
  - **Concrete Steps for Implementation:**
    1. Implement checklist regex scanner in `src/parser/MarkdownASTParser.ts` targeting lines matching `^(\s*)[-*+]\s+\[(.*?)\]\s+(.*)$`.
    2. Extract:
       - Bracket character `<char>` (e.g. `' '`, `'x'`, `'/'`, etc.).
       - Clean task text (strip markdown links/inline formatting for tree display or preserve as tooltip).
       - Exact `BracketRange` offsets: line number, open bracket col, char col, close bracket col.
    3. Attach parsed checklist items to the nearest active heading in the stack; attach to `SpecGroup.rootTasks` if preceding the first heading.
    4. Add unit test suite validating bracket character extraction and column coordinates.

- [x] **TASK-2.4: Indented Sub-Task Hierarchy Parser**
  - **Ties to Acceptance Criteria:** `2.3.1`, `2.3.2`, `2.3.3`
  - **Concrete Steps for Implementation:**
    1. In `src/parser/MarkdownASTParser.ts`, calculate leading indentation whitespace (spaces/tabs) for each checklist item.
    2. Maintain an indentation stack: if item $B$ has higher indentation than preceding item $A$, add $B$ as a child in $A.subTasks$.
    3. Propagate child completion statistics up through parent tasks.
    4. Unit test deeply nested sub-tasks (2–4 levels of indentation).

---

## Milestone 3: Hierarchical TreeView & Jump-to-Source Navigation (MVP Complete)

- [x] **TASK-3.1: TaskTreeDataProvider Implementation & Hierarchy Mapping**
  - **Ties to Acceptance Criteria:** `3.1.1`, `3.1.2`, `3.1.3`, `3.2.1`, `3.2.2`, `3.2.3`
  - **Concrete Steps for Implementation:**
    1. Create `src/views/TaskTreeDataProvider.ts` implementing `vscode.TreeDataProvider<TaskTreeNode>`.
    2. Implement `getTreeItem(element: TaskTreeNode): vscode.TreeItem`:
       - `SpecGroupNode`: Set collapsible state to `Expanded`, icon `codicon:package` or `codicon:folder`.
       - `HeadingNode`: Set collapsible state to `Expanded`, icon `codicon:bookmark`.
       - `TaskNode`: Set collapsible state to `None` (or `Collapsed` if it has sub-tasks).
    3. Implement `getChildren(element?: TaskTreeNode): TaskTreeNode[]`:
       - If `element === undefined`: Return all `SpecGroupNode`s.
       - If `element instanceof SpecGroupNode`: Return top-level headings and root tasks.
       - If `element instanceof HeadingNode`: Return child headings and checklist tasks under this heading.
       - If `element instanceof TaskNode`: Return `subTasks`.

- [x] **TASK-3.2: Aggregate Progress & Completion Statistics Calculation**
  - **Ties to Acceptance Criteria:** `3.3.1`, `3.3.2`, `3.3.3`, `8.5.2`
  - **Concrete Steps for Implementation:**
    1. Create `src/models/TaskStatsCalculator.ts`.
    2. Implement recursive count: calculate `totalCountable` and `completedCount` for each `HeadingNode` and `SpecGroupNode`.
    3. When `mdTaskView.showProgressCount` is enabled, format description string `(${completed}/${total})` on each branch node.
    4. Ensure unmapped or cancelled tasks are excluded from completed counts according to template rules.

- [x] **TASK-3.3: Jump-to-Source Navigation Command**
  - **Ties to Acceptance Criteria:** `4.1.1`, `4.1.2`, `4.1.3`, `4.2.1`, `4.2.2`
  - **Concrete Steps for Implementation:**
    1. Register command `mdTaskView.jumpToSource` in `src/commands/NavigationCommands.ts`.
    2. Assign command to `TaskNode` and `HeadingNode` tree items with argument `(fileUri, line)`.
    3. In the command handler, open document using `vscode.window.showTextDocument(fileUri, { preserveFocus: false, preview: false })`.
    4. Scroll viewport to center the target line using `editor.revealRange(range, vscode.TextEditorRevealType.InCenter)`.
    5. Highlight target line momentarily using a text editor selection or fleeting text decoration.

---

## Milestone 4: Continuous Filesystem Watching & Live Disk Sync

- [x] **TASK-4.1: Live FileSystemWatcher for Spec Files**
  - **Ties to Acceptance Criteria:** `5.1.1`, `5.1.2`, `5.1.3`, `5.1.4`
  - **Concrete Steps for Implementation:**
    1. Create `src/services/FileSystemWatcherService.ts`.
    2. Create `vscode.FileSystemWatcher` matching `${specPathPattern}/${taskFileName}`.
    3. Subscribe to `onDidChange`, `onDidCreate`, and `onDidDelete`.
    4. On `onDidCreate` or `onDidDelete`, re-evaluate spec groups and refresh TreeView.
    5. On `onDidChange`, re-parse the specific file and trigger an incremental node refresh.

- [x] **TASK-4.2: Active Editor Buffer Sync Listener**
  - **Ties to Acceptance Criteria:** `5.2.1`, `5.2.2`, `5.2.3`
  - **Concrete Steps for Implementation:**
    1. Register `vscode.workspace.onDidChangeTextDocument` listener.
    2. Filter events to documents matching active `tasks.md` file URIs.
    3. Pass document buffer text directly to `MarkdownASTParser.parse(text, uri)` without reading disk.
    4. Verify unsaved changes in open editors reflect immediately in the tree view.

- [x] **TASK-4.3: Debounced Dispatcher & Incremental Cache Invalidation**
  - **Ties to Acceptance Criteria:** `5.3.1`, `5.3.2`
  - **Concrete Steps for Implementation:**
    1. Create `src/utils/DebounceDispatcher.ts` with configurable trailing delay (150ms for buffer typing, 250ms for disk events).
    2. Implement `SpecModelCache` storing `Map<string, SpecGroup>` keyed by file URI.
    3. On change event, invalidate and replace only the affected `SpecGroup` in the cache.
    4. Fire `_onDidChangeTreeData.fire(specGroupNode)` to perform targeted tree item updates.
    5. Benchmark parser with a 2,000-line markdown file to verify <20ms execution time.

---

## Milestone 5: In-Place Task State Toggling & Non-Destructive Mutation

- [x] **TASK-5.1: Surgical WorkspaceEdit Mutation Service**
  - **Ties to Acceptance Criteria:** `6.2.1`, `6.2.2`, `6.2.3`, `10.2.1`, `10.2.2`, `10.2.3`
  - **Concrete Steps for Implementation:**
    1. Create `src/services/SurgicalMutationService.ts`.
    2. Implement `mutateTaskChar(task: TaskNode, newChar: string): Promise<boolean>`:
       - Construct `vscode.Range` exactly spanning `(line, charCol)` to `(line, charCol + 1)`.
       - Create `vscode.WorkspaceEdit` and call `edit.replace(task.fileUri, range, newChar)`.
       - Execute `await vscode.workspace.applyEdit(edit)`.
    3. Wrap in `try/catch` to handle file locking and read-only errors with non-blocking user warnings.
    4. Verify line indentation, list markers, and task text remain completely untouched.

- [x] **TASK-5.2: State Toggle Command & Next-State Transition Handler**
  - **Ties to Acceptance Criteria:** `6.1.1`, `6.1.2`, `8.4.2`
  - **Concrete Steps for Implementation:**
    1. Register command `mdTaskView.toggleState(node: TaskNode)`.
    2. Query `StateTemplateEngine.getNextState(node.char)` to determine the replacement character.
    3. Add inline action button (`contributes.menus["view/item/context"]`) on task tree items to trigger `toggleState`.
    4. Call `SurgicalMutationService.mutateTaskChar(node, nextChar)`.
    5. Verify the tree item updates its visual icon instantly.

- [x] **TASK-5.3: Undo/Redo Stack Integration & Buffer Synchronization**
  - **Ties to Acceptance Criteria:** `6.3.1`, `6.3.2`
  - **Concrete Steps for Implementation:**
    1. Validate that `applyEdit` pushes directly into the active editor undo stack.
    2. Test pressing `Ctrl+Z` in the open document: verify the bracket character reverts on screen and the TreeView reflects the reverted state.
    3. Write an integration test verifying that toggling state followed by undo restores original text identically.

---

## Milestone 6: Expressive Visual Styling (Green Circles & Strikethrough)

- [x] **TASK-6.1: Green Circle Done Indicator Icon Implementation**
  - **Ties to Acceptance Criteria:** `7.1.1`, `7.1.2`
  - **Concrete Steps for Implementation:**
    1. In `src/views/TaskTreeItemFactory.ts`, define icon resolver for completed tasks.
    2. Instantiate `vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('charts.green'))`.
    3. Provide fallback/high-contrast color support for light, dark, and high-contrast themes.
    4. Verify visual appearance across standard VS Code color themes (Default Dark+, Light+, Monokai, Solarized).

- [x] **TASK-6.2: Crossed-Out (Strikethrough) Label Transformer**
  - **Ties to Acceptance Criteria:** `7.2.1`, `7.2.2`, `7.2.3`
  - **Concrete Steps for Implementation:**
    1. Create `src/utils/textDecorators.ts`.
    2. Implement `applyStrikethrough(text: string): string` using Unicode combining strike characters (`\u0336`).
    3. In `TaskTreeItemFactory`, check `task.state.strikethrough && config.strikeThroughCompleted`:
       - If true: apply strikethrough transformation to `treeItem.label`.
       - If false: retain unmodified task text.
    4. Populate `treeItem.tooltip` with clean, unformatted task text and location metadata.

- [x] **TASK-6.3: Pending & Neutral Status Icon Styling**
  - **Ties to Acceptance Criteria:** `7.3.1`, `7.3.2`
  - **Concrete Steps for Implementation:**
    1. Assign `vscode.ThemeIcon('circle-large-outline')` to pending tasks (`[ ]`).
    2. Use standard editor foreground color for pending task labels without strikethrough.
    3. Set `treeItem.contextValue = 'taskItem'` to enable contextual menus.

---

## Milestone 7: State Template System & Obsidian Tasks Mode (`*.jsonc`)

- [x] **TASK-7.1: JSONC State Template Parser & Schema Validator**
  - **Ties to Acceptance Criteria:** `8.3.1`, `8.3.2`, `8.3.3`
  - **Concrete Steps for Implementation:**
    1. Create `src/templates/StateTemplateEngine.ts`.
    2. Import `jsonc-parser` to parse JSON with comments and trailing commas into `StateTemplate` objects.
    3. Implement validation logic checking required fields: `name`, `defaultState`, and array of `states` (`char`, `id`, `label`, `icon`, `countsAsCompleted`, `nextState`).
    4. Implement diagnostic reporting: if custom file fails validation, log error and fallback to standard template.

- [x] **TASK-7.2: Standard & Obsidian Tasks Bundled Templates**
  - **Ties to Acceptance Criteria:** `8.1.1`, `8.2.1`, `8.2.2`, `8.2.3`, `8.2.4`, `8.2.5`, `8.2.6`, `8.2.7`
  - **Concrete Steps for Implementation:**
    1. Create `resources/templates/standard.jsonc`:
       - `[ ]` Not Started $\rightarrow$ `[x]` Done.
    2. Create `resources/templates/obsidian.jsonc`:
       - `[ ]` Not Started (`circle-large-outline`)
       - `[/]` In Progress (`sync` or `pie-amber`, Amber color)
       - `[x]` Done (`pass-filled`, Green color, strikethrough)
       - `[-]` Cancelled (`circle-slash`, Muted, strikethrough)
       - `[?]` Clarification (`question`, Purple/Cyan color)
       - `[!]` Important (`warning`/`error`, Red color)
    3. Ensure only `Done` (`[x]`) is flagged with `countsAsCompleted: true`.

- [x] **TASK-7.3: Template Selection & Settings Reactivity**
  - **Ties to Acceptance Criteria:** `8.1.2`
  - **Concrete Steps for Implementation:**
    1. Add `mdTaskView.stateTemplate` enum to `package.json` (`["Standard (GFM)", "Obsidian Tasks", "Custom"]`).
    2. Add `mdTaskView.customTemplatePath` string setting.
    3. Connect template changes in `ConfigurationManager` to `StateTemplateEngine.loadTemplate()`.
    4. Trigger a full tree refresh whenever the active template is switched.

- [x] **TASK-7.4: Context Menu "Set Task State" Submenu Implementation**
  - **Ties to Acceptance Criteria:** `8.4.1`
  - **Concrete Steps for Implementation:**
    1. Declare submenu `mdTaskView.taskStateSubmenu` under `contributes.submenus` in `package.json`.
    2. Register dynamic commands or command parameters for setting specific states: `mdTaskView.setTaskState(node, targetChar)`.
    3. Populate the context menu with all available states from the active template.
    4. Hook command into `SurgicalMutationService.mutateTaskChar`.

- [x] **TASK-7.5: Unmapped Bracket Character Fallback Engine**
  - **Ties to Acceptance Criteria:** `8.5.1`, `8.5.2`, `8.5.3`
  - **Concrete Steps for Implementation:**
    1. In `StateTemplateEngine.getState(char)`, return a `FallbackStateDefinition` if `char` is not found in the template.
    2. Assign icon `codicon:circle-small-filled` with neutral color and label `Unknown state [${char}]`.
    3. Ensure fallback items are excluded from progress counts and never crash during parsing or rendering.

---

## Milestone 8: View Controls, Filtering & Multi-Root Workspace Support

- [x] **TASK-8.1: Filter Completed Tasks View Action & Persistent State**
  - **Ties to Acceptance Criteria:** `9.1.1`, `9.1.2`, `9.1.3`, `9.1.4`
  - **Concrete Steps for Implementation:**
    1. Register command `mdTaskView.toggleFilterCompleted` with icon `codicon:filter`.
    2. Add button to `menus["view/title"]` in `package.json`.
    3. Persist toggle state using `vscode.ExtensionContext.workspaceState`.
    4. In `TaskTreeDataProvider.getChildren()`, filter out tasks where `isCompleted === true` or state is cancelled when filter is active.
    5. Omit headings that have no remaining visible children.

- [x] **TASK-8.2: Collapse All & Force Refresh Title Bar Controls**
  - **Ties to Acceptance Criteria:** `9.2.1`, `9.2.2`
  - **Concrete Steps for Implementation:**
    1. Register `mdTaskView.collapseAll` using standard VS Code `workbench.actions.treeView.mdTaskView.tasksView.collapseAll` command.
    2. Register `mdTaskView.refresh` command bound to `codicon:refresh`.
    3. Implement cache invalidation and full re-scan in `refresh` command handler.

- [x] **TASK-8.3: Empty Workspace Welcome View & Sample Spec Initializer**
  - **Ties to Acceptance Criteria:** `9.3.1`, `9.3.2`, `9.3.3`
  - **Concrete Steps for Implementation:**
    1. Define `viewsWelcome` contribution in `package.json` for `mdTaskView.tasksView`.
    2. Add markdown notice: *"No specification task files found matching `./spec/*/tasks.md`."*
    3. Add command button `[Create Sample Spec]` linked to `mdTaskView.createSampleSpec`.
    4. Implement `createSampleSpec`: create `./spec/sample/tasks.md` with demo headings and checklist tasks, then open the file in the editor.
    5. Add secondary button `[Open Settings]` linking to `workbench.action.openSettings?mdTaskView`.

- [x] **TASK-8.4: Multi-Root Workspace Discovery & Group Prefixing**
  - **Ties to Acceptance Criteria:** `1.1.3`
  - **Concrete Steps for Implementation:**
    1. When `vscode.workspace.workspaceFolders.length > 1`, prepend the workspace folder name to each `SpecGroup` label (e.g., `[backend] auth`).
    2. Ensure relative path resolution and filesystem watchers operate cleanly across multiple disjoint repository roots.

---

## Milestone 9: Automated Testing, Documentation & Packaging

- [x] **TASK-9.1: Comprehensive Unit Test Suite (Vitest)**
  - **Ties to Acceptance Criteria:** `2.1.1`–`2.3.3`, `8.3.1`, `10.1.1`
  - **Concrete Steps for Implementation:**
    1. Create test fixtures under `test/fixtures/` with complex markdown structures:
       - Heading level gaps (`# H1` directly to `### H3`).
       - Unheaded checklist items.
       - Indented sub-tasks with mixed tab/space indentation.
       - Malformed lines and unclosed brackets.
    2. Implement parser unit tests in `test/unit/parser.test.ts`.
    3. Implement template engine tests in `test/unit/templates.test.ts` validating JSONC parsing and state cycling.
    4. Implement mutation calculation tests in `test/unit/mutation.test.ts`.

- [x] **TASK-9.2: VS Code Integration & E2E Test Suite**
  - **Ties to Acceptance Criteria:** `5.1.2`, `6.2.1`, `6.3.1`
  - **Concrete Steps for Implementation:**
    1. Configure `@vscode/test-electron` test runner in `test/integration/runTest.ts`.
    2. Write test verifying extension activation and `TreeDataProvider` tree population.
    3. Write test executing `mdTaskView.toggleState` verifying `tasks.md` text modification on disk.
    4. Write test validating live update on external disk write.

- [x] **TASK-9.3: Documentation, Readme & Animated Previews**
  - **Concrete Steps for Implementation:**
    1. Write comprehensive `README.md` containing:
       - Feature walkthrough with GIF demonstrations.
       - Configuration options reference table.
       - State template setup guide (Standard vs Obsidian Tasks).
       - Keyboard shortcuts and context menu commands.
    2. Create `CHANGELOG.md` and `LICENSE`.

- [x] **TASK-9.4: VSIX Production Packaging & Manifest Verification**
  - **Concrete Steps for Implementation:**
    1. Run `npm run package` (esbuild minification).
    2. Verify bundle size is `< 500 KB`.
    3. Run `vsce package` to generate production `.vsix` archive.
    4. Install `.vsix` into a fresh VS Code instance to verify end-to-end functionality.
