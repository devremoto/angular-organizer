
import { convertToControlFlow } from '../out/template-converter.js';
import assert from 'assert';

const snippet = `
<div *ngIf="show">
    <!-- <div> Unbalanced tag in comment -->
    Content
</div>
`;

console.log("Original:");
console.log(snippet);

const converted = convertToControlFlow(snippet, 'test.html');

console.log("\nConverted:");
console.log(converted);

if (converted.includes('@if (show)')) {
    console.log("SUCCESS: *ngIf was converted despite comment");
} else {
    console.error("FAIL: *ngIf was NOT converted");
    process.exit(1);
}
