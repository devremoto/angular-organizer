# Angular Organizer

Organize Angular TypeScript files with one command:
- Sort **imports** (external → internal aliases → relative) with blank lines between groups.
- Enforce Angular-aware **class member order**:
  1. constants (readonly static)
  2. private fields
  3. `@Input` properties
  4. `@Output` properties
  5. getters, then setters
  6. constructor
  7. public methods
  8. private methods

> Works great alongside ESLint/Prettier. Use this when you want deterministic, Angular-aware ordering.

## Installation

### Marketplace (recommended)
1. Open VS Code → **Extensions** (Ctrl/Cmd+Shift+X).
2. Search **“Angular Organizer”**.
3. Click **Install**.

### Manual (.vsix)
If your team shares a packaged build:
- Extensions view → `…` → **Install from VSIX…** → pick the `.vsix` file, or
- CLI:
  ```bash
  code --install-extension angular-organizer-*.vsix
