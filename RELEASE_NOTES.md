# Release Notes - v0.1.11

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.11** introduces goalpost flag icons for milestones and differentiates milestones from normal document headings using configurable keyword detection.

---

## 🛠️ What's New

### ⛳ Goalpost Flag Icons for Milestones
- **Flag Icons for Milestones:** Milestone headings now display a goalpost flag icon instead of a bookmark.
  - **Outlined Flag (`$(flag)`):** Rendered when a milestone contains unfinished tasks (or is in progress).
  - **Filled Green Flag:** Rendered in solid theme green when all tasks contained within the milestone are completed.

### 🔖 Distinct Normal Headings
- **Preserved Section Dividers:** Normal headings that do not contain milestone keywords (such as `# Overview`, `## Database Schema`, or `## Notes`) retain the original bookmark icon (`$(bookmark)`).
- **Outlined Only:** Normal headings are always displayed with an outlined bookmark (never filled), clearly separating structural document sections from milestones.
- **Headings Without Tasks:** Headings without tasks underneath them continue to be displayed cleanly in the tree view outline.

### ⚙️ Configurable Milestone Keywords (`mdTaskView.milestoneKeywords`)
- **Default Keywords:** `["Milestone", "Release", "Alpha", "Beta"]` (case-insensitive with word boundary matching and optional plural support).
- **Customizable:** Users can configure their own list of milestone identifiers (e.g. `Sprint`, `Phase`, `Epic`) in VS Code Settings (`mdTaskView.milestoneKeywords`).

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.11.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.11.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.11.vsix` file.
