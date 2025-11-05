import { organizeAllText } from '../out/organize.js';

console.log('✅ Starting debug test...');

const simpleContent = `class Test {
    abstract prop: string;
    constructor() {}
    abstract method(): void;
}`;

console.log('Testing simple content:', simpleContent);

try {
    console.log('Calling organizeAllText...');
    const result = organizeAllText(simpleContent, 'test.ts');
    console.log('✅ Success! Result length:', result.length);
    console.log('Result:', result);
} catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
}