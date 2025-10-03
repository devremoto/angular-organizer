# Angular Organizer

An opinionated VS Code extension that organizes **Angular + TypeScript** files.

- Sorts **imports** (external → aliases → relative) with blank lines between groups (no extra trailing newline).
- Reorders **class members** with Angular-aware buckets and `private / protected / public` splits.
- Detects and groups **@Input properties**, **@Input setters**, **@Output**, **@ViewChild/@ViewChildren**.
- Places **constructor** first, then **Angular lifecycle methods** (`ngOnInit`, …), then **signal hooks** (`effect`, `computed`) as class-field hooks.
- Optional `//#region … //#endregion …` wrappers per group.
- Optional cleanups: **remove comments (except regions)**; **strip blank lines before organizing**.
- Runs **Format Document** at the end (Prettier or your configured formatter), if enabled.

---

## Installation

### VS Code Marketplace (recommended)
1. VS Code → **View → Extensions** (Ctrl/Cmd+Shift+X)
2. Search **“Angular Organizer”**
3. **Install**

### Manual (.vsix)
- **UI:** Extensions → `…` → **Install from VSIX…** → choose the `.vsix`
- **CLI:**
  ```bash
  code --install-extension angular-organizer-<version>.vsix
  ```

---

## Quick Start

1. Open any Angular `.ts` file.
2. **F1 / Ctrl(Cmd)+Shift+P** → **Angular Organizer: Organize All**.
3. Imports are grouped, members reordered, optional regions added, and the file formatted.

---

## Commands

**Core**
- **Angular Organizer: Organize All** — Sort imports + reorder all members.
- **Angular Organizer: Sort Imports** — Only organize imports.
- **Angular Organizer: Reorder All Members** — Members only (no imports).

**Fields & Decorators**
- Reorder Constants  
- Reorder Private Fields / Reorder Protected Fields  
- Reorder **@Inputs (properties)**  
- Reorder **@Input Setters**  
- Reorder **@Outputs**  
- Reorder **View Queries (@ViewChild/@ViewChildren)**

**Accessors & Constructor**
- Reorder Accessors (non-@Input get/set)  
- Reorder Constructor

**Methods**
- Reorder Public Methods / Reorder Protected Methods / Reorder Private Methods

**Cleanup**
- **Remove Comments (keep #regions)** — Removes `//`, `/* */`, `/** */` everywhere, but preserves `//#region` and `//#endregion` lines.

> Right-click in the editor or Explorer → **Angular Organizer** submenu → commands organized by **Fields**, **Decorators**, **Accessors**, **Methods**, **Cleanup**.

---

## Member Ordering (Canonical)

1. **Constants** — `static readonly`
2. **Fields · private** (plain, non-decorated)
3. **Fields · protected**
4. **Fields · public**
5. **@Input properties**
6. **@Input setters** (e.g. `@Input() set foo(v) {}`)
7. **@Output properties**
8. **@ViewChild/@ViewChildren**
9. **Getters · public**
10. **Getters · protected**
11. **Getters · private**
12. **Setters (non-@Input) · public**
13. **Setters (non-@Input) · protected**
14. **Setters (non-@Input) · private**
15. **Constructor**
16. **Angular lifecycle methods** — `ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngAfterContentInit`, `ngAfterContentChecked`, `ngAfterViewInit`, `ngAfterViewChecked`, `ngOnDestroy` (kept in this order)
17. **Signal hooks** — class fields initialized with `effect(...)` or `computed(...)` (e.g. `_ = effect(() => …)`)
18. **Methods · public** (non-`ng*`)
19. **Methods · protected**
20. **Methods · private**

Additional behavior:
- **One blank line between consecutive methods**.
- Optional **`//#region` wrappers** around each non-empty group.
- Pre-existing region lines inside members are stripped to avoid duplicate `//#endregion`.

---

## Import Sorting

- **external (npm)** → **aliases** → **relative**
  - Aliases default: `@app/**`, `@shared/**`, `@core/**` (tweak in code if your project uses different prefixes).
- Alphabetical within each group.
- Blank line between groups.
- **No trailing newline** added after the last import.

---

## Settings

Open **Settings** (Ctrl/Cmd+,) → search **Angular Organizer**, or add to your `settings.json`:

```json
{
  "angularOrganizer.emitRegions": true,
  "angularOrganizer.formatAfterOrganize": true,
  "angularOrganizer.cleanupCommentsOnOrganize": false,
  "angularOrganizer.removeBlankLinesBeforeOrganize": true
}
```

- **`emitRegions`**: Wrap each group with `//#region … //#endregion …`.
- **`formatAfterOrganize`**: Run **Format Document** after the command.
- **`cleanupCommentsOnOrganize`**: Remove all comments except region lines after organizing.
- **`removeBlankLinesBeforeOrganize`**: Pre-pass that removes blank lines **outside** of strings/template literals before organizing.

**Formatter tip (optional):**
```json
{
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.formatOnSave": false
}
```

---

## Keybindings (optional)

Open **Keyboard Shortcuts** → **Open Keyboard Shortcuts (JSON)** and add:

```json
[
  { "key": "ctrl+alt+o", "command": "angularOrganizer.organizeAll", "when": "editorLangId == typescript" },
  { "key": "ctrl+alt+i", "command": "angularOrganizer.sortImports", "when": "editorLangId == typescript" },
  { "key": "ctrl+alt+1", "command": "angularOrganizer.reorder.inputs", "when": "editorLangId == typescript" },
  { "key": "ctrl+alt+2", "command": "angularOrganizer.reorder.outputs", "when": "editorLangId == typescript" }
]
```

---

## Local Development (for contributors)

1. `npm install`
2. `npm run compile`
3. **F5** in VS Code → an **Extension Development Host** window opens
4. Open a `.ts` file there → run **Angular Organizer: Organize All**

**Debug tips (unbound breakpoints?)**
- `tsconfig.json`:
  ```json
  { "compilerOptions": { "outDir": "out", "rootDir": "src", "sourceMap": true, "inlineSources": true, "module": "commonjs", "target": "ES2022" } }
  ```
- `.vscode/launch.json`:
  ```json
  {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Run Extension",
        "type": "extensionHost",
        "request": "launch",
        "runtimeExecutable": "${execPath}",
        "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
        "outFiles": ["${workspaceFolder}/out/**/*.js"],
        "preLaunchTask": "npm: compile"
      }
    ]
  }
  ```
- Ensure `package.json` has `"main": "./out/extension.js"` and you’re not running a globally installed VSIX while debugging.

---

## Troubleshooting

- **Nothing changed** — Fix TypeScript syntax errors first; organizer skips unparsable files. It may also already be in canonical order.
- **Duplicate `//#endregion`** — Use **Remove Comments (keep #regions)** once, or disable regions; the organizer also strips embedded region lines within members.
- **Imports grouped wrong** — Adjust alias prefixes in the sorter (currently `@app`, `@shared`, `@core`).
- **Formatter didn’t run** — Enable **Format After Organize** and set a default formatter for TypeScript.

---

## CI/CD (optional)

See `.github/workflows/ci-cd.yml` to automatically:
- build + compile on pushes to `main`
- bump patch version, tag, package as `.vsix`
- publish to **VS Code Marketplace** (`VSCE_PAT`) and **Open VSX** (`OPEN_VSX_TOKEN`)
- attach the `.vsix` to a GitHub Release

---

## License

MIT
