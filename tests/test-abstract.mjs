import { organizeAllText } from '../out/organize.js';

console.log('✅ Successfully imported organization function');

// Test file content with abstract properties and methods
const testContent = `import { Component } from '@angular/core';
import { inject, input, output, signal } from '@angular/core';

@Component({
    selector: 'app-abstract-test',
    template: '<div>Abstract Test</div>'
})
export abstract class AbstractTestComponent {
    // Constants
    static readonly DEFAULT_VALUE = 'default';
    
    // Abstract properties - should come after constants
    abstract abstractProperty: string;
    abstract anotherAbstractProp: number;
    
    // Regular fields
    private privateField = 'private';
    protected protectedField = 'protected';
    public publicField = 'public';
    
    // Signal APIs
    count = signal<number>(0);
    userName = input<string>('');
    nameChange = output<string>();
    
    // Constructor
    constructor() {
        console.log('Constructor');
    }
    
    // Abstract methods - should come after constructor
    abstract abstractMethod(): void;
    abstract calculateValue(input: number): string;
    
    // Lifecycle
    ngOnInit() {
        console.log('ngOnInit');
    }
    
    // Regular methods
    public publicMethod() {
        console.log('Public method');
    }
    
    protected protectedMethod() {
        console.log('Protected method');
    }
    
    private privateMethod() {
        console.log('Private method');
    }
}`;

console.log('🧪 Testing abstract property and method organization...');
console.log('📖 Original content:');
console.log('--- ORIGINAL ---');
console.log(testContent);

console.log('\n🔄 Organizing...');

try {
    console.log('About to call organizeAllText...');
    const organized = organizeAllText(testContent, 'abstract-test.component.ts');
    console.log('organizeAllText returned, length:', organized.length);

    console.log('\n✅ Organization complete!');
    console.log('\n📝 Organized content:');
    console.log('--- ORGANIZED ---');
    console.log(organized);

    // Check organization order
    const lines = organized.split('\n');
    let foundConstants = false;
    let foundAbstractProps = false;
    let foundConstructor = false;
    let foundAbstractMethods = false;

    console.log('\n🔍 Checking organization order:');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes('Constants')) {
            foundConstants = true;
            console.log(`✅ Constants section found at line ${i + 1}`);
        }

        if (line.includes('Abstract properties')) {
            foundAbstractProps = true;
            if (foundConstants) {
                console.log(`✅ Abstract properties section found at line ${i + 1} (after constants)`);
            } else {
                console.log(`❌ Abstract properties section found at line ${i + 1} (before constants)`);
            }
        }

        if (line.includes('Constructor')) {
            foundConstructor = true;
            console.log(`✅ Constructor section found at line ${i + 1}`);
        }

        if (line.includes('Abstract methods')) {
            foundAbstractMethods = true;
            if (foundConstructor) {
                console.log(`✅ Abstract methods section found at line ${i + 1} (after constructor)`);
            } else {
                console.log(`❌ Abstract methods section found at line ${i + 1} (before constructor)`);
            }
        }
    }

} catch (error) {
    console.error('❌ Error during organization:', error);
}