# Angular Organizer - AI Coding Instructions

This extension organizes Angular + TypeScript files by reordering class members, sorting imports, and converting template control flow.

## Architecture & Core Components

- **Lazy Loading Pattern**: The extension uses a "heavy/light" split. `src/extension-optimized.ts` is the entry point and handles VS Code integration. It dynamically imports `src/organize.ts` (which uses `ts-morph`) only when a heavy transformation is requested.
- **AST Manipulation**: `src/organize.ts` is the core logic for TypeScript files. It uses `ts-morph` to parse and reorder class members into specific "buckets".
- **Template Conversion**: `src/template-converter.ts` uses string-based regex/parsing to convert Angular structural directives (`*ngIf`, `*ngFor`) to the new control flow syntax (`@if`, `@for`).
- **Utilities**: `src/text-utils.ts` contains lightweight functions for comment and region removal.

## Canonical Member Ordering

When modifying organization logic, adhere to this strict order:
1. Constants (`static readonly`)
2. Fields (private -> protected -> public)
3. Decorators (@Input -> @Input setters -> @Output -> @ViewChild)
4. Accessors (get/set)
5. Constructor
6. Angular Lifecycle (ngOnInit, etc.)
7. Signal Hooks (`effect`, `computed` as class fields)
8. Methods (public -> protected -> private)
9. `ngOnDestroy` (Always last)

## Developer Workflows

- **Build**: 
  - `npm run build:dev`: Compiles and bundles with esbuild.
  - `npm run watch`: Continuous compilation for development.
- **Testing**: 
  - Tests are standalone `.mjs` scripts in `tests/`.
  - Run all tests: `npm test`.
  - Run specific test: `node tests/test-proximity.mjs`.
- **Debugging**: Use `tests/debug-*.mjs` files for targeted debugging of specific features like nested control flow or method proximity.

## Project Conventions

- **No Heavy Dependencies in Entry Point**: Keep `src/extension-optimized.ts` free of `ts-morph` or other large libraries.
- **String-based Template Parsing**: Template transformations in `src/template-converter.ts` should remain string-based to avoid heavy HTML parsers where possible.
- **Region Support**: Always respect the `emitRegions` option when reordering members. Use `stripRegionLines` before wrapping to avoid duplicates.
- **Comment Preservation**: Maintain comments when the `cleanupCommentsOnOrganize` option is disabled, `cleanupCommentsOnOrganize` must be false by default.
- **Method Proximity**: When `optimizeMethodProximity` is enabled, group methods that call each other together.

## Key Files for Reference

- [src/organize.ts](src/organize.ts): Implementation of member reordering and import sorting.
- [src/template-converter.ts](src/template-converter.ts): Logic for Angular control flow conversion.
- [src/extension-optimized.ts](src/extension-optimized.ts): VS Code command registration and lazy loading logic.
- [package.json](package.json): Command definitions and build scripts.
