import { organizeAllText } from '../out/organize.js';

console.log('✅ Testing error handling...');

// Invalid TypeScript content
const badContent = `class Test {
    abstract prop: string
    // Missing semicolon, unclosed brace, etc.
    constructor() {
        console.log('test'
    // Missing closing brace
`;

console.log('Testing with invalid content...');

try {
    const result = organizeAllText(badContent, 'test.ts');
    console.log('✅ Somehow worked? Result length:', result.length);
} catch (error) {
    console.log('✅ Correctly caught error:', error.message);
}

console.log('Done!');