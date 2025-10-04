// Test script for method proximity optimization
import { organizeAllText, organizeAllTextWithProximity } from '../out/organize.js';

const testCode = `import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  template: \`<div>Example</div>\`
})
export class ExampleComponent {
  
  // This method calls validateInput and processData
  public handleSubmit(): void {
    if (this.validateInput()) {
      this.processData();
      this.updateUI();
    }
  }

  // This method is called by displayResults
  private formatData(): string {
    return 'formatted data';
  }

  // This method calls formatData
  public displayResults(): void {
    const formatted = this.formatData();
    console.log(formatted);
  }

  // This method is called by handleSubmit
  private validateInput(): boolean {
    return this.checkRequired() && this.checkFormat();
  }

  // This method has no relationships
  private unrelatedMethod(): void {
    console.log('unrelated');
  }

  // This method is called by validateInput
  private checkRequired(): boolean {
    return true;
  }

  // This method is called by validateInput  
  private checkFormat(): boolean {
    return true;
  }

  // This method is called by handleSubmit
  private processData(): void {
    this.transformData();
    this.saveData();
  }

  // This method is called by processData
  private transformData(): void {
    console.log('transforming...');
  }

  // This method is called by processData
  private saveData(): void {
    console.log('saving...');
  }

  // This method is called by handleSubmit
  private updateUI(): void {
    console.log('updating UI...');
  }
}`;

console.log('=== ORIGINAL CODE ===');
console.log(testCode);

console.log('\n=== STANDARD ORGANIZE ===');
const standardOrganized = organizeAllText(testCode, 'test.ts');
console.log(standardOrganized);

console.log('\n=== PROXIMITY ORGANIZE ===');
const proximityOrganized = organizeAllTextWithProximity(testCode, 'test.ts');
console.log(proximityOrganized);

console.log('\n=== COMPARISON ===');
console.log('Standard organize sorts methods alphabetically within each access level.');
console.log('Proximity organize groups related methods together based on call relationships.');
console.log('\n=== DONE ===');