# Release Notes - v0.1.17

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.17** makes milestone detection stricter, so headings that only mention a milestone are no longer shown as one.

---

## 🛠️ What's Changed

### ⛳ Milestones Are Headings That Start With "Milestone"
- **Keyword at the Start:** A heading is a milestone only when its text starts with the keyword, e.g. `## Milestone 1: Setup`. Notes, anchors and bookmark headings that mention it later, such as `## Notes on Milestone 1`, keep the bookmark icon.
- **Nothing in Front:** Numbering or an emoji before the keyword (`## 1. Milestone`, `## 🚀 Milestone 1`) also means the heading is not a milestone. Bold or italic around the keyword is fine.
- **No Plurals:** `## Milestones` is now a normal section, since it is usually an overview rather than a milestone itself.
- **Unchanged:** Matching is still case-insensitive (`## milestone 2` counts) and whole-word only (`## Milestone-1 checks` counts, `## Milestoneish` does not).

### 🔑 Default Keyword List Is Now Just "Milestone"
- **Default:** `mdTaskView.milestoneKeywords` now defaults to `["Milestone"]`. Headings starting with `Release`, `Alpha` or `Beta` are no longer milestones by default.
- **Bring Them Back:** Add any keywords you want to the `mdTaskView.milestoneKeywords` setting. If you had already set your own list, it is unchanged.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.17.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.17.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.17.vsix` file.
