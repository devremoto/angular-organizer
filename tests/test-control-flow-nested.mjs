import { convertToControlFlow } from '../out/template-converter.js';
import assert from 'assert';

const nestedContent = `
<div *ngIf="condition">
    <div>
        <span>Nested content</span>
    </div>
    <div *ngFor="let item of items">
        <div>{{ item }}</div>
    </div>
</div>
`;

console.log('Testing nested control flow conversion...');
const converted = convertToControlFlow(nestedContent, 'test.html');

// Check if @if wraps the whole content
const ifStart = converted.indexOf('@if (condition) {');
const ifEnd = converted.lastIndexOf('}');
const innerDiv = converted.indexOf('<span>Nested content</span>');

if (ifStart !== -1 && ifEnd !== -1 && innerDiv > ifStart && innerDiv < ifEnd) {
    console.log('✅ Nested content is correctly wrapped by @if');
} else {
    console.error('❌ Nested content is NOT correctly wrapped');
    console.log(converted);
    process.exit(1);
}

// Check if @for is present and correct
if (converted.includes('@for (item of items; track item)')) {
    console.log('✅ @for conversion is present');
} else {
    console.error('❌ @for conversion is missing');
    process.exit(1);
}

console.log('All tests passed!');
