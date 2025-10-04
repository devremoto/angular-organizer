// Test script for ngOnDestroy placement
import { organizeAllText, organizeAllTextWithProximity } from '../out/organize.js';

const testCodeWithNgOnDestroy = `import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-test',
  template: '<div>Test</div>'
})
export class TestComponent implements OnInit, OnDestroy {
  
  private data: string = '';
  
  ngOnDestroy(): void {
    console.log('Component destroyed');
    this.cleanup();
  }
  
  ngOnInit(): void {
    console.log('Component initialized');
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    console.log('After view init');
  }
  
  private processData(): void {
    console.log('Processing data');
    this.validateData();
  }
  
  private validateData(): void {
    console.log('Validating');
  }
  
  private loadData(): void {
    console.log('Loading data');
  }
  
  private cleanup(): void {
    console.log('Cleaning up');
  }
  
  public getData(): string {
    this.processData();
    return this.data;
  }
  
  ngOnChanges(): void {
    console.log('On changes');
  }
}`;

console.log('=== ORIGINAL CODE ===');
console.log(testCodeWithNgOnDestroy);

console.log('\n=== STANDARD ORGANIZED (ngOnDestroy should be LAST) ===');
const organized = organizeAllText(testCodeWithNgOnDestroy, 'test.ts');
console.log(organized);

console.log('\n=== PROXIMITY ORGANIZED (ngOnDestroy should be LAST) ===');
const proximityOrganized = organizeAllTextWithProximity(testCodeWithNgOnDestroy, 'test.ts');
console.log(proximityOrganized);

console.log('\n=== DONE ===');