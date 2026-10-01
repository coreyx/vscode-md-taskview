# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Removed all external product references from documentation and package keywords.

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
- Comprehensive unit test suite using Vitest for AST parsing, multi-state transitions, and bracket mutation range calculations.
- Complete specification suite under `spec/vscode-md-taskview/` (`product.md`, `milestones.md`, `requirements.md`, `tech.md`, `design.md`, `tasks.md`).
- MIT License and project README.
