// Test with the user's specific code
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { convertToControlFlow } = require('../out/template-converter.js');

const userCode = `<div *ngIf="true" ngbDropdownMenu aria-labelledby="dropdownBasic1"
            id="navbarCollapse">
            <ul class="navbar-nav me-auto mb-2 mb-md-0">
                @for(category of categories; track category.id) {
                <li
                    ngbDropdownItem class="nav-item"
                    role="button"
                    tabindex="0"
                    routerLinkActive="active-link">
                    <a class="nav-link"
                        tabindex="0"
                        (keydown)=" $event.key === 'Enter' ? navigateToCategory(category) : null"
                        (click)="navigateToCategory(category)">{{category.title}}</a>
                </li>
                }
            </ul>
        </div>`;

console.log('🧪 Testing User Code Conversion...\n');
console.log('INPUT:');
console.log(userCode);

const result = convertToControlFlow(userCode, 'test.component.html');

console.log('\nOUTPUT:');
console.log(result);

console.log('\nDID IT CONVERT?', result !== userCode ? '✅ YES' : '❌ NO');

if (result !== userCode) {
    console.log('\n✨ Conversion successful! The *ngIf="true" was converted to @if (true) { ... }');
} else {
    console.log('\n❌ No conversion happened. Need to debug the regex patterns.');
}