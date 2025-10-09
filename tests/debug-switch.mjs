// Debug ngSwitch conversion
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { convertToControlFlow } = require('../out/template-converter.js');

const input = `<div [ngSwitch]="viewType">
  <app-list *ngSwitchCase="'list'">List View</app-list>
  <app-grid *ngSwitchCase="'grid'">Grid View</app-grid>
  <app-default *ngSwitchDefault>Default View</app-default>
</div>`;

const result = convertToControlFlow(input, 'test.component.html');

console.log('INPUT:');
console.log(input);
console.log('\nOUTPUT:');
console.log(result);