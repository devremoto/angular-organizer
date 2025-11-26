import { removeRegions } from '../out/text-utils.js';

const testCode = `
import { Component } from '@angular/core';

//#region Imports
import { Input } from '@angular/core';
//#endregion Imports

@Component({
  selector: 'app-test',
  template: '<div>Test</div>'
})
export class TestComponent {
  //#region Fields
  private data: string = '';
  //#endregion Fields

  //#region Methods
  public getData(): string {
    return this.data;
  }
  //#endregion Methods
}
`;

console.log('🧪 Testing Region Removal...\n');
console.log('=== ORIGINAL CODE ===');
console.log(testCode);

const cleaned = removeRegions(testCode, 'test.ts');

console.log('\n=== AFTER REMOVING REGIONS ===');
console.log(cleaned);

if (cleaned.includes('//#region') || cleaned.includes('//#endregion')) {
    console.error('❌ Failed: Regions still present');
    process.exit(1);
}

if (!cleaned.includes('private data: string')) {
    console.error('❌ Failed: Code content removed');
    process.exit(1);
}

console.log('\n✅ Region removal test passed!');
