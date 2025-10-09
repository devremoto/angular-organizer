import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test the hasStructuralDirective function directly
const testString1 = "        *ngIf=\"hasChildren(node) && isExpanded(node)\"";
const testString2 = "    <app-tree-view";
const testString3 = "<div *ngIf=\"condition\">content</div>";

console.log('Testing hasStructuralDirective function:');

// Create a simple test for the regex
const regex = /\*ng(For|If|Switch)|(\[ngSwitch\])|(\*ngSwitchCase)|(\*ngSwitchDefault)/;

console.log(`Test 1: "${testString1}"`);
console.log(`  Contains *ngIf: ${regex.test(testString1)}`);

console.log(`Test 2: "${testString2}"`);
console.log(`  Contains *ngIf: ${regex.test(testString2)}`);

console.log(`Test 3: "${testString3}"`);
console.log(`  Contains *ngIf: ${regex.test(testString3)}`);

// Test the pattern matching in findCompleteElementFromLine
const tagMatch1 = testString1.match(/<([\w-]+)[\s\S]*?\*ng/);
const tagMatch2 = testString2.match(/<([\w-]+)[\s\S]*?\*ng/);
const tagMatch3 = testString3.match(/<([\w-]+)[\s\S]*?\*ng/);

console.log('\nTesting tag matching pattern:');
console.log(`Pattern 1: ${tagMatch1}`);
console.log(`Pattern 2: ${tagMatch2}`);
console.log(`Pattern 3: ${tagMatch3}`);