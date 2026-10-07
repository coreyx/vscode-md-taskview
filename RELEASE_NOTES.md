# Release Notes - v0.1.12

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.12** fixes task lists whose tasks are written as headings, which previously showed up as plain outline sections that never counted as complete.

---

## 🛠️ What's Fixed

### ✅ Checklist Items Written as Headings
- **Recognized as Tasks:** Headings whose text is a checklist item (e.g. `### - [x] Task 1.1: Scaffolding`) are now treated as tasks instead of section headings.
  - **Correct State Icons:** Checked heading tasks display the filled green done icon rather than an outline bookmark, and no longer show a literal `- [x]` prefix in their label.
  - **Counted Toward Progress:** Heading tasks are included in `(completed/total)` counts, so milestones made up of them fill in green once every task is checked.
  - **Toggle From the Tree:** Heading tasks can be cycled through states from the tree view like any other task.

### 🌿 Sub-Tasks Under Heading Tasks
- **Nested Checklists:** Checklist items listed beneath a heading task appear as its sub-tasks.
- **Nested Heading Tasks:** A deeper heading task (e.g. `####`) nests under the shallower heading task above it.

### 🧭 Preview Navigation
- **Scroll to the Task Itself:** In Markdown Preview mode, clicking a heading task or one of its sub-tasks scrolls to that task's own heading rather than the enclosing milestone.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.12.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.12.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.12.vsix` file.
