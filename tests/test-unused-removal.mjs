import { organizeAllText } from '../out/organize.js';

console.log('✅ Successfully imported organization function');

// Test file content with unused variables and methods
const testContent = `import { Component, Input, Output, EventEmitter } from '@angular/core';
import { inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms'; // Should be removed - unused
import { Router } from '@angular/router'; // Should be removed - unused

@Component({
    selector: 'app-test',
    template: '<div>Test</div>'
})
export class TestComponent {
    // Used properties
    count = signal<number>(0);
    userName = input<string>('');
    private httpClient = inject(HttpClient);

    // Unused private properties - should be removed
    private unusedField = 'unused';
    private anotherUnusedField = 42;

    // Unused private method - should be removed
    private unusedMethod() {
        return 'never called';
    }

    // Used private method - should NOT be removed
    private usedMethod() {
        return 'used';
    }

    // Lifecycle method - should NOT be removed even if "unused"
    private ngOnInit() {
        console.log('init');
    }

    // Public method - should NOT be removed even if unused (for safety)
    public publicMethod() {
        return 'public';
    }

    // Method that uses the private method
    doSomething() {
        return this.usedMethod();
    }
}`;

console.log('🧪 Testing unused variable/method removal...');
console.log('📖 Original content:');
console.log('--- ORIGINAL ---');
console.log(testContent);

console.log('\n🔄 Organizing with unused removal...');

try {
    const organized = organizeAllText(testContent, 'test.component.ts');

    console.log('\n✅ Organization complete!');
    console.log('\n📝 Organized content:');
    console.log('--- ORGANIZED ---');
    console.log(organized);

    // Check what was removed
    console.log('\n🔍 Checking what was removed:');
    const originalLines = testContent.split('\n');
    const organizedLines = organized.split('\n');

    // Check for removed imports
    const hasFormBuilder = organized.includes('FormBuilder');
    const hasRouter = organized.includes('Router');
    console.log(`1. FormBuilder import removed: ${!hasFormBuilder ? '✅' : '❌'}`);
    console.log(`2. Router import removed: ${!hasRouter ? '✅' : '❌'}`);

    // Check for removed private fields/methods
    const hasUnusedField = organized.includes('unusedField');
    const hasAnotherUnusedField = organized.includes('anotherUnusedField');
    const hasUnusedMethod = organized.includes('unusedMethod()');
    const hasUsedMethod = organized.includes('usedMethod');
    const hasPublicMethod = organized.includes('publicMethod');

    console.log(`3. Private unusedField removed: ${!hasUnusedField ? '✅' : '❌'}`);
    console.log(`4. Private anotherUnusedField removed: ${!hasAnotherUnusedField ? '✅' : '❌'}`);
    console.log(`5. Private unusedMethod removed: ${!hasUnusedMethod ? '✅' : '❌'}`);
    console.log(`6. Private usedMethod kept: ${hasUsedMethod ? '✅' : '❌'}`);
    console.log(`7. Public method kept: ${hasPublicMethod ? '✅' : '❌'}`);

} catch (error) {
    console.error('❌ Error during organization:', error);
}