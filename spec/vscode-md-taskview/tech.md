# Technology Stack & Tooling (`tech.md`)

This document details the complete technology choices, libraries, runtimes, build systems, and architectural rationale for the **VS Code Markdown Task View** (`vscode-md-taskview`) extension.

---

## 1. Core Runtime & Language

| Component | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Language** | **TypeScript** | `^5.4.0` | Strict static typing, robust interfaces for VS Code API contracts, modern ECMAScript features (ES2022). |
| **Runtime Target** | **Node.js** | `^20.x` | Matches the Electron/Node environment embedded in modern VS Code releases. |
| **Compilation Target**| **ES2022** | — | Native async/await, optional chaining, nullish coalescing, and ES modules. |
| **VS Code Engine** | **VS Code API** | `^1.88.0` | Enables modern TreeView capabilities, `TreeItemLabel` markdown styling, `ThemeIcon`, and `ThemeColor` tokens. |

---

## 2. Key Dependencies & Libraries

### 2.1 Production Dependencies (Minimal & Audited)

To guarantee ultra-fast activation time and minimal extension bundle footprint, third-party dependencies are strictly controlled:

| Package | Purpose | Version | Why Chosen |
| :--- | :--- | :--- | :--- |
| **`jsonc-parser`** | JSON with Comments parsing | `^3.2.1` | Official Microsoft parser used within VS Code itself. Robustly parses `*.jsonc` template files with comments and trailing commas without security vulnerabilities. |
| **`fast-glob`** | High-performance filesystem globbing | `^3.3.2` | Rapidly scans workspaces for spec directories (`./spec/*`) across Windows, macOS, and Linux with cross-platform path normalization. |
| **`micromark`** / **`mdast-util-from-markdown`** | Markdown tokenizer & AST generation | `^2.0.0` | Industry-standard, ultra-fast CommonMark/GFM parser. Provides 100% accurate character/line ranges (`position`) required for surgical in-place editing. |
| **`mdast-util-gfm-task-list-item`** | GFM task list AST extension | `^2.0.0` | Extracts GFM task list brackets with exact position offsets. |

> [!NOTE]
> All core markdown parsing and position mapping can alternatively be handled by a dedicated, zero-dependency streaming tokenizer designed specifically for checklist bracket detection if we choose to eliminate external AST dependencies entirely during Milestone 2.

---

## 3. Development, Build & Bundling Toolchain

### 3.1 Bundler & Compiler
- **`esbuild` (`^0.20.0`):**
  - Compiles and bundles TypeScript into a single minified bundle (`dist/extension.js`) in under 50ms.
  - Bundles external dependencies while externalizing `'vscode'`.
  - Enables source maps for direct debugging in VS Code.
- **`tsc` (TypeScript Compiler):**
  - Runs in `--noEmit` mode alongside `esbuild` for type validation and lint-free build verification.

### 3.2 Scripts & NPM Lifecycle
```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "watch": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node --watch --sourcemap",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext ts",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vscode-test",
    "package": "esbuild ./src/extension.ts --bundle --minify --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "package:vsix": "vsce package"
  }
}
```

---

## 4. Testing Frameworks

We employ a two-tiered testing strategy to guarantee both lightning-fast unit verification and genuine VS Code runtime compliance:

### 4.1 Unit Testing: `Vitest` (`^1.4.0`)
- **Scope:** Markdown AST parser, heading depth hierarchy, JSONC template loader, state transition machine, and string range calculations.
- **Rationale:** Runs headlessly outside Electron in milliseconds, fully supports TypeScript and ESM, and offers instant watch mode during local TDD.

### 4.2 Integration & E2E Testing: `@vscode/test-electron` (`^2.3.9`) & `@vscode/test-cli`
- **Scope:** Extension activation, TreeDataProvider rendering, `applyEdit` undo stack behavior, and live filesystem watcher reactivity inside a real VS Code instance.
- **Rationale:** Official VS Code extension test framework ensuring API compatibility with real editor instances.

---

## 5. Code Quality & Formatting

- **Linter:** `eslint` (`^8.57.0`) with `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`.
- **Formatting:** `prettier` (`^3.2.5`) with single quotes, semicolons, and 2-space indentation.
- **Git Hooks (Optional):** Simple npm scripts or `husky` + `lint-staged` to enforce lint and typecheck on commit.

---

## 6. Packaging & Distribution

- **Tool:** `@vscode/vsce` (Visual Studio Code Extension Manager).
- **Artifact:** Self-contained `.vsix` file.
- **Distribution:** Visual Studio Marketplace and Open VSX Registry (for VSCodium / Gitpod / Eclipse Theia).
- **Target Size:** Target `.vsix` bundle size `< 500 KB` due to esbuild tree-shaking.
