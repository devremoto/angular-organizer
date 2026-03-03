import { convertToControlFlow, convertToStructuralDirectives } from '../out/template-converter.js';

console.log('🧪 Testing TS Inline Template Conversion...\n');

const tsContent = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`
    <div *ngIf="show">
      <span *ngFor="let item of items">{{item}}</span>
    </div>
  \`
})
export class TestComponent {}
`;

console.log('Original TS:');
console.log(tsContent);

console.log('\n--- Converting to Control Flow ---');
const converted = convertToControlFlow(tsContent, 'test.component.ts');
console.log(converted);

console.log('\n--- Converting back to Structural Directives ---');
const reversed = convertToStructuralDirectives(converted, 'test.component.ts');
console.log(reversed);

console.log('\n✅ TS Conversion tests completed!');
