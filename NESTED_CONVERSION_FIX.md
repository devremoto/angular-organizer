# 🐛 **Nested Control Flow Conversion Fix**

## 📝 **Issue Description**
The previous implementation of the control flow converter used regex-based matching which failed to correctly identify the closing tag of elements when they contained nested elements of the same type.

**Example of Failure:**
```html
<div *ngIf="condition">
  <div>Nested content</div>
</div>
```
The converter would incorrectly identify the inner `</div>` as the closing tag of the outer `div`, resulting in broken code:
```html
@if (condition) {
  <div>
    <div>Nested content</div>
}
  </div>
```

## 🛠 **The Fix**
We have replaced the regex-based matching with a robust **Depth-Counting Parser**.

### **How it works:**
1. **Iterative Search**: The converter now scans the template for structural directives one by one.
2. **Element Boundary Detection**: When a directive is found, it identifies the start of the element.
3. **Depth Counting**: It then scans forward, counting opening and closing tags of the same type to find the *true* matching closing tag.
   - Handles nested tags: `<div>...<div>...</div>...</div>`
   - Handles self-closing tags: `<div />`
   - Handles attributes and strings correctly.

### **Result**
Nested structures are now correctly wrapped:

```html
@if (condition) {
  <div>
    <div>Nested content</div>
  </div>
}
```

## ✅ **Verification**
A new regression test `tests/test-control-flow-nested.mjs` has been added to ensure this scenario is always handled correctly.
The fix also covers `[ngSwitch]` containers and `*ngSwitchCase` elements.
