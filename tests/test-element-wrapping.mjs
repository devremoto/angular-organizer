// Test the new element wrapping functionality
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { convertToControlFlow } = require('../out/template-converter.js');

console.log('🧪 Testing Element Wrapping Control Flow Conversion...\n');

const testCases = [
    {
        name: "*ngFor with element wrapping",
        input: `<li *ngFor="let item of items">{{ item.name }}</li>`,
        expected: `@for (item of items; track item) {
  <li>{{ item.name }}</li>
}`
    },
    {
        name: "*ngIf with element wrapping",
        input: `<p *ngIf="showMessage">Hello World</p>`,
        expected: `@if (showMessage) {
  <p>Hello World</p>
}`
    },
    {
        name: "*ngFor with index",
        input: `<div *ngFor="let user of users; let i = index">{{ i }}. {{ user.name }}</div>`,
        expected: `@for (user of users; track user; let i = $index) {
  <div>{{ i }}. {{ user.name }}</div>
}`
    },
    {
        name: "*ngIf with alias",
        input: `<span *ngIf="user$ | async as user">{{ user.name }}</span>`,
        expected: `@if (user$ | async; as user) {
  <span>{{ user.name }}</span>
}`
    },
    {
        name: "Complete ngSwitch example",
        input: `<div [ngSwitch]="viewType">
  <app-list *ngSwitchCase="'list'">List View</app-list>
  <app-grid *ngSwitchCase="'grid'">Grid View</app-grid>
  <app-default *ngSwitchDefault>Default View</app-default>
</div>`,
        expected: `@switch (viewType) {
@case ('list') {
  <app-list>List View</app-list>
}
  @case ('grid') {
  <app-grid>Grid View</app-grid>
}
  @default {
  <app-default>Default View</app-default>
}
}`
    },
    {
        name: "Nested elements with *ngFor",
        input: `<ul>
  <li *ngFor="let category of categories">
    <h3>{{ category.name }}</h3>
    <span>{{ category.count }} items</span>
  </li>
</ul>`,
        expected: `<ul>
  @for (category of categories; track category) {
  <li>
    <h3>{{ category.name }}</h3>
    <span>{{ category.count }} items</span>
  </li>
}
</ul>`
    }
];

// Test each case
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = convertToControlFlow(testCase.input, 'test.component.html');
    const success = result.trim() === testCase.expected.trim();

    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input:\n${testCase.input}`);
    console.log(`Expected:\n${testCase.expected}`);
    console.log(`Actual:\n${result}`);
    console.log(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`);

    if (!success) {
        console.log(`❌ Difference found:`);
        console.log(`Expected length: ${testCase.expected.length}, Actual length: ${result.length}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    if (success) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('🎉 All element wrapping tests passed!');
    console.log('\n✨ Control flow conversion now properly wraps elements:');
    console.log('  - @for (item of items; track item) { <element>content</element> }');
    console.log('  - @if (condition) { <element>content</element> }');
    console.log('  - @switch (value) { @case (value) { <element>content</element> } }');
} else {
    console.log('❌ Some tests failed. Element wrapping needs adjustment.');
}