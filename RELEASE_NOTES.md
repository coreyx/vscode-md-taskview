# Release Notes - v0.1.6

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.6** fixes Markdown Preview navigation so clicking tasks and milestone headings in the tree view scrolls the preview to the clicked milestone or task section.

---

## 🛠️ Enhancements & Bug Fixes

### 1. Markdown Preview Navigation & Anchor Scrolling
- **Issue:** In v0.1.5, when Markdown Preview was configured as the default editor, clicking on a milestone or task opened the document in preview mode but remained at the top of the file without jumping to the clicked line.
- **Root Cause:** VS Code's Markdown preview webview matches URL fragments against element DOM `id` attributes. Only Markdown headings receive `id` attributes (using GitHub-compatible slugs such as `#milestone-1-project-foundation`), whereas raw line numbers (`#L16`) do not match any DOM elements and were ignored.
- **Fix:**
  - Implemented `Slugifier` to generate URL-safe heading anchor slugs matching VS Code's Markdown engine and GitHub specifications.
  - Heading nodes now provide their slug, and task nodes inherit their parent milestone/heading's slug.
  - When navigating in preview mode, `jumpToSource` uses the heading slug fragment (`#<slug>`), enabling the preview to scroll directly to the milestone or task.

### 2. Preview Tab Re-Resolution for Subsequent Clicks
- Handled already-open Markdown Preview tabs in `vscode.window.tabGroups` so clicking different milestones or tasks in succession reliably re-navigates and scrolls the preview to the new section.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.6.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.6.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.6.vsix` file.
