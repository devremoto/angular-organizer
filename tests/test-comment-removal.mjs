// Test script for comment removal
import { removeCommentsExceptRegions } from '../out/text-utils.js';

const testCodeWithComments = `import { Component } from '@angular/core';

// This is a regular comment that should be removed
@Component({
  selector: 'app-test',
  template: '<div>Test</div>' // inline comment to remove
})
export class TestComponent {
  
  //#region Fields
  private data: string = ''; // This comment should be removed
  //#endregion Fields
  
  /* This is a multi-line comment
     that should be completely removed */
  
  //#region Methods
  public getData(): string {
    // Another comment to remove
    return this.data; /* inline multi-line comment */
  }
  
  /** JSDoc comment should be removed too */
  private processData(): void {
    console.log('Processing'); // yet another comment
  }
  //#endregion Methods
  
  // Final comment to remove
}`;

console.log('=== ORIGINAL CODE WITH COMMENTS ===');
console.log(testCodeWithComments);

console.log('\n=== AFTER REMOVING COMMENTS (keeping regions) ===');
const cleaned = removeCommentsExceptRegions(testCodeWithComments, 'test.ts');
console.log(cleaned);

console.log('\n=== DONE ===');