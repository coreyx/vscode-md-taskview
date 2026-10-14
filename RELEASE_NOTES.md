# Release Notes - v0.1.15

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.15** changes the color of in-progress tasks from yellow to blue.

---

## 🛠️ What's Changed

### 🔵 Blue In-Progress Tasks
- **New Color:** In-progress tasks (`[/]`) in the **Obsidian Tasks** template are now displayed in blue instead of yellow.
- **Both Icons:** The color applies to the rotating spinner and to the static circular arrow icon shown when motion is off.
- **Theme-Aware:** The color is the theme's `charts.blue`, so it follows your color theme.
- **Custom Templates:** A custom `*.jsonc` template keeps whatever `color` it specifies. To match, set its in-progress state to `"color": "charts.blue"`.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.15.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.15.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.15.vsix` file.
