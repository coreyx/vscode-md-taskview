# Release Notes - v0.1.18

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.18** fixes how underscores are handled in milestone detection and in tree view labels.

---

## 🛠️ What's Fixed

### ⛳ `Milestone_notes` Is Not a Milestone
- **Underscore Is Part of the Word:** Milestone matching now treats `_` like a letter or digit, so a heading such as `## Milestone_notes` or `## Milestone_1` is a normal section rather than a milestone.
- **Unchanged:** `## Milestone 1`, `## Milestone-1 checks` and `## **Milestone** 1` are still milestones.

### 🏷️ Underscores Inside Words Are Shown as Written
- **The Bug:** Labels with underscores doubled inside a word were mangled: `Mile__stone__` appeared as `Mile_stone_`.
- **The Fix:** Underscore emphasis is now removed only when it starts and ends at a word edge, the same way Markdown renders it. `Mile__stone__` and `foo__bar__baz` are shown exactly as written.
- **Unchanged:** `snake_case` names stay intact, and paired emphasis such as `_Milestone_`, `__Milestone__` or `**Milestone**` is still removed from labels.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.18.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.18.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.18.vsix` file.
