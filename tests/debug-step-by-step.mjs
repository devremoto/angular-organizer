// Debug step by step ngSwitch conversion
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the individual functions directly from the source
// Note: We'll need to manually call each step

const input = `<div [ngSwitch]="viewType">
  <app-list *ngSwitchCase="'list'">List View</app-list>
  <app-grid *ngSwitchCase="'grid'">Grid View</app-grid>
  <app-default *ngSwitchDefault>Default View</app-default>
</div>`;

console.log('ORIGINAL INPUT:');
console.log(input);

// Step 1: Convert children first
let step1 = input;

// Fixed ngSwitchCase pattern - use [\w-]+ to match element names with hyphens
const ngSwitchCasePattern = /(<([\w-]+)[^>]*?\*ngSwitchCase\s*=\s*"([^"]*)"[^>]*?>)([\s\S]*?)(<\/\2>)/g;
step1 = step1.replace(ngSwitchCasePattern, (match, openTag, tagName, caseValue, content, closeTag) => {
    console.log(`  Matched ngSwitchCase: ${tagName}, case: ${caseValue}`);
    const cleanOpenTag = openTag.replace(/\s*\*ngSwitchCase\s*=\s*"[^"]*"/, '');
    return `@case (${caseValue}) {\n  ${cleanOpenTag}${content}${closeTag}\n}`;
});

console.log('\nAFTER STEP 1 (ngSwitchCase):');
console.log(step1);

// Fixed ngSwitchDefault pattern - use [\w-]+ to match element names with hyphens
const ngSwitchDefaultPattern = /(<([\w-]+)[^>]*?\*ngSwitchDefault[^>]*?>)([\s\S]*?)(<\/\2>)/g;
step1 = step1.replace(ngSwitchDefaultPattern, (match, openTag, tagName, content, closeTag) => {
    console.log(`  Matched ngSwitchDefault: ${tagName}`);
    const cleanOpenTag = openTag.replace(/\s*\*ngSwitchDefault/, '');
    return `@default {\n  ${cleanOpenTag}${content}${closeTag}\n}`;
});

console.log('\nAFTER STEP 2 (ngSwitchDefault):');
console.log(step1);

// Step 2: Convert container - use [\w-]+ to match element names with hyphens
const ngSwitchPattern = /(<([\w-]+)[^>]*?\[ngSwitch\]\s*=\s*"([^"]+)"[^>]*?>)([\s\S]*?)(<\/\2>)/g;
const step2 = step1.replace(ngSwitchPattern, (match, openTag, tagName, switchExpression, content, closeTag) => {
    console.log(`  Matched ngSwitch container: ${tagName}, expression: ${switchExpression}`);
    const cleanContent = content.trim();
    return `@switch (${switchExpression}) {\n${cleanContent}\n}`;
});

console.log('\nFINAL RESULT:');
console.log(step2);