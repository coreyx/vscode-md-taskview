# Release Notes - v0.1.16

## VS Code Markdown Task View (`vscode-md-taskview`)

Release **v0.1.16** fixes the in-progress spinner ignoring VS Code's reduced motion setting.

---

## 🛠️ What's Fixed

### 🔄 Spinner Respects Reduced Motion
- **The Bug:** Since v0.1.13 the extension checked a setting named `accessibility.reducedMotion`, which VS Code does not have. Turning on reduced motion therefore never stopped the in-progress spinner.
- **The Fix:** The extension now reads VS Code's real setting, `workbench.reduceMotion`. When it is `on`, in-progress tasks show a static circular arrow icon instead of the rotating spinner, and the tree updates as soon as the setting changes.
- **`auto` (the default):** VS Code follows your system's motion preference but does not expose it to extensions, so the spinner keeps running. To stop it, either set `workbench.reduceMotion` to `on` or turn off `mdTaskView.animateTaskIcons`.

---

## 📦 Installation

Download the attached `vscode-md-taskview-0.1.16.vsix` asset below and install it into VS Code:

### Option A: Via Command Line
```bash
code --install-extension vscode-md-taskview-0.1.16.vsix
```

### Option B: Via VS Code Interface
1. Open the **Extensions View** in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Click the **`...` (Views and More Actions)** menu icon at the top-right corner.
3. Select **Install from VSIX...**
4. Select the downloaded `vscode-md-taskview-0.1.16.vsix` file.
