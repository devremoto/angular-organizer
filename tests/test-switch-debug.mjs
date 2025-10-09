import { convertToControlFlow } from '../out/organize.js';

// Test specific ngSwitchCase patterns
const testCases = [
    `<span *ngSwitchCase="'list'">List View</span>`,
    `<span *ngSwitchCase='"grid"'>Grid View</span>`,
    `<span *ngSwitchCase="value">Value View</span>`,
    `<div [ngSwitch]="currentView">
    <span *ngSwitchCase="'list'">List View</span>
    <span *ngSwitchCase="'grid'">Grid View</span>
    <span *ngSwitchDefault>Default View</span>
  </div>`
];

console.log('🧪 Testing ngSwitchCase Conversion...\n');

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}:`);
    console.log('Before:', testCase);
    const result = convertToControlFlow(testCase, 'test.html');
    console.log('After: ', result);
    console.log('Changed:', testCase !== result ? '✅' : '❌');
    console.log('---');
});