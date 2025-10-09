// Debug test to understand the exact output
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { convertToControlFlow } = require('../out/template-converter.js');

const input = `<ul>
  <li *ngFor="let category of categories">
    <h3>{{ category.name }}</h3>
    <span>{{ category.count }} items</span>
  </li>
</ul>`;

const result = convertToControlFlow(input, 'test.component.html');

console.log('INPUT:');
console.log(JSON.stringify(input));
console.log('\nOUTPUT:');
console.log(JSON.stringify(result));
console.log('\nFORMATTED OUTPUT:');
console.log(result);