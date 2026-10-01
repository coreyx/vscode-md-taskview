# Release Notes - v0.1.5

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.5** respects VS Code default editor associations (`workbench.editorAssociations`) when clicking tasks and milestones, opening in Markdown Preview when configured.

---

## 🛠️ Enhancements & Improvements

### 1. Respect `workbench.editorAssociations` for `*.md`
- **Issue:** Previously, clicking on any task or heading always invoked `vscode.window.showTextDocument`, which forced files to open in the raw text editor even if the user configured `"workbench.editorAssociations": { "*.md": "vscode.markdown.preview.editor" }`.
- **Fix:** `NavigationCommands.jumpToSource` now detects `workbench.editorAssociations`:
  - When `*.md` is associated with Markdown Preview or another custom editor, the file opens directly in that preview editor at the target line (`#L{lineNumber}`).
  - When no custom association is configured, the file opens in the standard text editor with the line highlighted and centered.

### 2. Configurable `mdTaskView.openEditor` Setting
- Added a dedicated setting to control opening behavior:
  - `"auto"` (Default): Automatically respects `workbench.editorAssociations` (opens in Markdown Preview if configured, otherwise text editor).
  - `"textEditor"`: Always opens in the standard text editor and centers the target line, even if `workbench.editorAssociations` is set to preview.
  - `"preview"`: Always opens in Markdown Preview regardless of global editor associations.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.5.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.5.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.5.vsix` file.
