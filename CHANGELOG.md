# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-10-01

### Changed
- **Target Contained Level on Scoped Expand / Collapse:** Refined the scoped expand/collapse behavior so that selecting a container level (such as a spec group or parent heading) keeps that selected container expanded while collapsing or expanding all milestones/sections contained directly within it. This allows users to select a parent heading level and expand or collapse all sibling milestones at once to view or hide their nested tasks without collapsing the parent container itself.

## [0.1.8] - 2026-10-01

### Added
- **Context-Sensitive Expand / Collapse All:** When an item is selected or focused in the TreeView, clicking the toolbar Expand/Collapse toggle button now restricts its operation to the currently focused section (spec group, milestone heading, or parent task) and its descendants, preserving the expanded/collapsed state of other sections. If no item is selected, the toolbar button falls back to operating globally across the entire tree.
- **Section Expand & Collapse Context Menu:** Added dedicated right-click context menu actions ("Expand All in Section" and "Collapse All in Section") to all spec groups, milestone headings, and task items in the tree view.
- **Global Expand & Collapse Commands:** Added explicit `mdTaskView.collapseAllGlobal` and `mdTaskView.expandAllGlobal` commands to the Command Palette for full workspace collapse/expansion regardless of active selection.
- **Tree Hierarchy Navigation (`getParent`):** Implemented `getParent` and section resolver on `TaskTreeDataProvider` to associate child tasks with their parent milestones or tasks for contextual operations.

## [0.1.7] - 2026-10-01

### Added
- **Settings Gear Icon in View Title Toolbar:** Added a settings gear button (`$(gear)`) to the Markdown Tasks TreeView title bar that directly opens and filters VS Code Settings to `mdTaskView`.
- **Dynamic Expand / Collapse All Toggle Button:** Replaced the static one-way native collapse button with an interactive two-way toggle button (`$(collapse-all)` / `$(expand-all)`). Clicking "Collapse All" collapses all spec groups, milestone headings, and nested subtasks, seamlessly flipping the toolbar icon to "Expand All". Clicking "Expand All" restores all nodes to the expanded state and flips the icon back to "Collapse All".
- **Tree Node Generation Tracking:** Implemented generation versioning for tree node identifiers (`id#v<version>`) to ensure VS Code's internal TreeWidget cache properly reflects dynamic expansion and collapse transitions immediately upon clicking the toggle.

## [0.1.6] - 2026-10-01

### Fixed
- **Markdown Preview Navigation & Scrolling:** Fixed an issue where clicking a task or milestone while Markdown Preview is the active/default editor opened the document but failed to scroll to the clicked location. Headings now generate GitHub/VS Code-compatible anchor slugs (e.g. `#milestone-1-project-foundation`), and tasks are mapped to their parent heading's slug, allowing VS Code's Markdown preview webview to resolve the heading anchor and scroll directly to the selected milestone or task.
- **Preview Tab Re-Resolution:** Handled already-open Markdown Preview tabs via `vscode.window.tabGroups` so clicking different milestones or tasks in succession re-navigates and scrolls the preview to the newly selected section.

## [0.1.5] - 2026-10-01

### Added
- **Respect Default Editor & Markdown Preview (`workbench.editorAssociations`):** When clicking tasks or milestone headings in the tree view, the extension now inspects `workbench.editorAssociations` for `*.md` settings (such as `"vscode.markdown.preview.editor"`). If Markdown Preview is set as the default editor, files open directly in the preview at the target line (`#L{line}`) rather than forcing the text editor.
- **Configurable `mdTaskView.openEditor` Setting:** Added configuration option with values `'auto'` (default, automatically respects `workbench.editorAssociations`), `'textEditor'` (always opens in text editor and centers line), and `'preview'` (always opens in Markdown Preview).

## [0.1.4] - 2026-10-01

### Added
- **Completed Milestone Filled Bookmark Icon:** Added custom bundled filled bookmark SVG icons (`resources/icons/dark/` and `resources/icons/light/`) rendered in vibrant green to visually indicate when all tasks within a milestone/heading are completed. Incomplete or in-progress milestones retain the standard outline bookmark icon.
- **Milestone Tooltip Status:** Enhanced heading tooltips to indicate total and completed task counts along with explicit completion status.

## [0.1.3] - 2026-10-01

### Added
- **Markdown Bold & Italic Stripping:** Stripped bold and italic delimiter syntax (`**text**`, `*text*`, `__text__`, `_text_`, `***text***`, `___text___`) from task list items and headings in the tree view so titles like `- [x] **TASK-1.1: Extension Project Scaffolding & Build Tooling**` render cleanly without literal asterisks or underscores. Identifiers with underscores (`snake_case`) and arithmetic asterisks remain intact.
- **Spec Group H1 Name Resolution:** Added support for `mdTaskView.useH1AsGroupName` to display the cleaned first level-1 heading title as the spec group label.

## [0.1.2] - 2026-10-01

### Fixed
- **Esbuild Bundle Resolution for `jsonc-parser`:** Added `mainFields: ['module', 'main']` to esbuild configuration to resolve `jsonc-parser`'s ESM entry point rather than its UMD wrapper, eliminating runtime `Cannot find module './impl/format'` errors during extension activation.
- **Extension Command Registration:** Restored full command registration and TreeView initialization on startup, resolving `command 'mdTaskView.refresh' not found` and `command 'mdTaskView.toggleFilterCompleted' not found`.

## [0.1.1] - 2026-10-01

### Fixed
- **View Activation Lifecycle:** Added `onView:mdTaskView.tasksView` and command triggers to `activationEvents` so the extension activates immediately upon opening the sidebar view or clicking welcome view actions.
- **Spec Discovery:** Switched to direct `fast-glob` scanning with VS Code `findFiles` fallback, reliably discovering nested spec directories (`spec/vscode-md-taskview/tasks.md`), direct spec files (`spec/tasks.md`), and deep hierarchies (`spec/**/tasks.md`).
- **Create Sample Spec Action:** Fixed welcome view button execution to ensure `mdTaskView.createSampleSpec` activates and generates `./spec/sample/tasks.md`.
- **Open Settings Action:** Implemented dedicated `mdTaskView.openSettings` command so clicking "Open Settings" in the welcome view navigates directly to the filtered `mdTaskView` configuration settings.
- **Filesystem Watcher:** Broadened watcher pattern to monitor all task files across the spec directory hierarchy.

## [0.1.0] - 2026-10-01

### Added
- Automatic workspace spec discovery scanning for `tasks.md` in spec folders (default: `./spec/*`).
- Hierarchical sidebar TreeView mirroring Markdown document heading levels (`#` through `######`).
- Checklist item extraction with exact bracket column tracking (`[line, charCol]`).
- Jump-to-source navigation to open target markdown files and center/highlight the line in the active editor.
- Continuous live filesystem synchronization via `vscode.FileSystemWatcher` and open editor buffer listeners with intelligent debouncing.
- Surgical in-place task state toggling using `vscode.workspace.applyEdit` preserving all formatting and integrated with `Ctrl+Z` undo/redo history.
- Visual styling for task statuses: green circle check indicators (`pass-filled` tinted with `charts.green`), strikethrough styling for completed/cancelled tasks, and circle outlines for pending items.
- State Template System supporting:
  - Standard (GFM) binary checkboxes (`[ ]` $\leftrightarrow$ `[x]`).
  - Obsidian Tasks multi-state mode (`[ ]` Not Started, `[/]` In Progress, `[x]` Done, `[-]` Cancelled, `[?]` Clarification, `[!]` Important).
- Custom `*.jsonc` state template engine with support for comments and trailing commas.
- Right-click context submenu "Set Task State" to set any state directly.
- View controls: "Filter Completed Tasks" toggle, "Collapse All", and manual "Refresh".
- Empty workspace welcome guidance with "Create Sample Spec" generator.
- Multi-root workspace support with folder name prefixing for distinct spec groups.
- Comprehensive installation options (VSIX, F5 debugging, and local symlinks).
- Pre-configured `.vscode/launch.json` and `.vscode/tasks.json` for F5 Extension Host debugging.
- Packaging optimization via `.vscodeignore` reducing VSIX footprint to ~32 KB.
- Comprehensive unit test suite using Vitest for AST parsing, multi-state transitions, and bracket mutation range calculations.
- Complete specification suite under `spec/vscode-md-taskview/` (`product.md`, `milestones.md`, `requirements.md`, `tech.md`, `design.md`, `tasks.md`).
- MIT License and project README.
