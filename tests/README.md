# Tests

This directory contains test scripts for the Angular Organizer extension.

## Test Files

### `test-proximity.mjs`
Tests the method proximity optimization feature that groups related methods together based on call relationships.

**Usage:**
```bash
node tests/test-proximity.mjs
```

**What it tests:**
- Standard alphabetical method organization
- Proximity-based method clustering
- Comparison between both approaches

### `test-ng-destroy.mjs`
Tests that `ngOnDestroy` is always placed at the very end of the class, regardless of organization mode.

**Usage:**
```bash
node tests/test-ng-destroy.mjs
```

**What it tests:**
- Standard organization with `ngOnDestroy` placement
- Proximity organization with `ngOnDestroy` placement
- Lifecycle method ordering

### `test-comment-removal.mjs`
Tests the comment removal functionality that removes all comments except region markers.

**Usage:**
```bash
node tests/test-comment-removal.mjs
```

**What it tests:**
- Removal of single-line comments (`//`)
- Removal of multi-line comments (`/* */`) and JSDoc (`/** */`)
- Preservation of region comments (`//#region` and `//#endregion`)
- Handling of inline comments

### `test-proximity.ts`
TypeScript sample file with complex method relationships for manual testing in VS Code.

**Usage:**
- Open this file in VS Code
- Run Angular Organizer commands to test the extension manually
- Compare different organization modes

## Running Tests

Run all tests from the project root:

```bash
# Test method proximity optimization
node tests/test-proximity.mjs

# Test ngOnDestroy placement
node tests/test-ng-destroy.mjs

# Test comment removal
node tests/test-comment-removal.mjs

# Run all tests
npm test
```

## Prerequisites

Make sure the extension is compiled before running tests:

```bash
npm run compile
```