# Region Removal Feature

## Overview
Added a new feature to remove `//#region` and `//#endregion` markers from the code while preserving the content within them.

## Changes
1.  **`src/text-utils.ts`**: Added `removeRegions` function.
2.  **`src/extension-optimized.ts`**: Registered `angularOrganizer.removeRegions` command.
3.  **`package.json`**:
    *   Added `angularOrganizer.removeRegions` command.
    *   Added menu item under `Editor Context Menu > Angular Organizer > Cleanup`.
    *   Added keybinding `Ctrl+Alt+R`.
    *   Added test script `test:regions`.

## Verification
*   Created `tests/test-remove-regions.mjs`.
*   Verified that region markers are removed correctly.
*   Verified that indentation and content are preserved.
