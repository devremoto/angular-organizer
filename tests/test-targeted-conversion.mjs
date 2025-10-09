// Test targeted conversion at specific line
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { convertStructuralDirectiveAtSpecificLine } = require('../out/template-converter.js');

const testHtml = `<div class="container">
    <h1>Header</h1>
    <div *ngIf="true" ngbDropdownMenu aria-labelledby="dropdownBasic1"
         id="navbarCollapse">
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
            <li class="nav-item">
                <a class="nav-link">Normal link</a>
            </li>
        </ul>
    </div>
    <footer>Footer content</footer>
</div>`;

console.log('🧪 Testing Targeted Conversion at Specific Line...\n');

// Test converting the element at line 2 (the div with *ngIf)
const result = convertStructuralDirectiveAtSpecificLine(testHtml, 'test.component.html', 2);

console.log('INPUT:');
console.log(testHtml);

console.log('\nOUTPUT:');
console.log(result);

console.log('\nDID IT CONVERT ONLY THE TARGETED ELEMENT?', result !== testHtml ? '✅ YES' : '❌ NO');

// Test that other elements remain unchanged
const lines = testHtml.split('\n');
const resultLines = result.split('\n');

console.log('\n📋 Line-by-line comparison:');
lines.forEach((line, index) => {
    const resultLine = resultLines[index] || '';
    const changed = line !== resultLine;
    console.log(`Line ${index}: ${changed ? '🔄 CHANGED' : '✅ SAME'}`);
    if (changed) {
        console.log(`  Before: ${line}`);
        console.log(`  After:  ${resultLine}`);
    }
});