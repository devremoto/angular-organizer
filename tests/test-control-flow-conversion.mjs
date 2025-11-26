import { convertToControlFlow, convertStructuralDirectiveAtSpecificLine } from '../out/template-converter.js';

// Test HTML template conversion
const htmlTemplate = `
<div>
  <ul>
    <li *ngFor="let item of items; let i = index">{{ item.name }}</li>
  </ul>
  <p *ngIf="showMessage">Hello World!</p>
  <div [ngSwitch]="currentView">
    <span *ngSwitchCase="'list'">List View</span>
    <span *ngSwitchCase="'grid'">Grid View</span>
    <span *ngSwitchDefault>Default View</span>
  </div>
</div>
`;

// Test TypeScript component with inline template
const tsComponent = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`
    <div>
      <ul>
        <li *ngFor="let item of items; trackBy: trackByFn">{{ item.name }}</li>
      </ul>
      <p *ngIf="condition as result">Result: {{ result }}</p>
    </div>
  \`,
  styleUrls: ['./test.component.css']
})
export class TestComponent {
  items = [{ name: 'Item 1' }, { name: 'Item 2' }];
  condition = true;
  
  trackByFn(index: number, item: any) {
    return item.id;
  }
}
`;

console.log('🧪 Testing Angular Control Flow Conversion...\n');

// Test HTML conversion
console.log('📄 HTML Template Conversion:');
console.log('Before:');
console.log(htmlTemplate);
console.log('\nAfter:');
const convertedHtml = convertToControlFlow(htmlTemplate, 'test.component.html');
console.log(convertedHtml);

console.log('\n' + '='.repeat(50) + '\n');

// Test TypeScript component conversion
console.log('📄 TypeScript Component Conversion:');
console.log('Before:');
console.log(tsComponent);
console.log('\nAfter:');
const convertedTs = convertToControlFlow(tsComponent, 'test.component.ts');
console.log(convertedTs);

console.log('\n' + '='.repeat(50) + '\n');

// Test selective conversion (simulating cursor on specific line)
console.log('📄 Selective Conversion Test:');
const testHtml = '<li *ngFor="let item of items; let i = index">{{ item.name }}</li>';
console.log('Original line:', testHtml);

const convertedLine = convertStructuralDirectiveAtSpecificLine(
  testHtml,
  'test.html',
  0 // cursor line
);
console.log('Converted line:', convertedLine);

console.log('\n✅ Control Flow Conversion tests completed!');