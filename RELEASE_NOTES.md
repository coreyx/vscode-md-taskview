# Release Notes - v0.1.3

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.3** strips literal Markdown formatting (bold and italic) from task titles and headings, ensuring clean visual presentation in the TreeView.

---

## 🛠️ Enhancements & Improvements

### 1. Markdown Bold & Italic Delimiter Removal in TreeView
- **Issue:** When specification checklist items or headings use Markdown bold (`**bold**`, `__bold__`) or italic (`*italic*`, `_italic_`), VS Code TreeItems rendered the asterisks and underscores literally as plain text (e.g. `**TASK-1.1: Extension Project Scaffolding & Build Tooling**`). Additionally, when strikethrough styling was enabled for completed items, the combining strike characters were applied across the asterisks (`*̶*̶T̶A̶S̶K̶...`).
- **Fix:** Implemented delimiter-stripping in `MarkdownASTParser`:
  - Strips `**...**` and `__...__` (bold).
  - Strips `*...*` and `_..._` (italic).
  - Strips `***...***` and `___...___` (bold + italic) and nested variations.
  - Follows CommonMark word boundary rules to preserve `snake_case` variable names and arithmetic asterisks (`2 * 3 = 6`).
  - Applied to task clean text, heading labels, and spec group titles.

### 2. Group Name Resolution
- Added support for `mdTaskView.useH1AsGroupName` to display the first level-1 heading title (with markdown formatting stripped) as the spec group label when enabled.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.3.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.3.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.3.vsix` file.
