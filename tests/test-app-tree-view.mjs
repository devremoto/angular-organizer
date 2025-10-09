import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the conversion function
const templateConverterPath = path.join(__dirname, '..', 'out', 'template-converter.js');
let convertFunction;

try {
    const templateConverter = await import('file://' + templateConverterPath);
    convertFunction = templateConverter.convertStructuralDirectiveAtSpecificLine;
    console.log('✅ Successfully imported conversion function');
} catch (error) {
    console.error('❌ Failed to import conversion function:', error.message);
    process.exit(1);
}

// Test file path
const testFilePath = path.join(__dirname, 'test-app-tree-view.html');

console.log('\n🧪 Testing app-tree-view conversion...');
console.log('File:', testFilePath);

// Read original content
const originalContent = fs.readFileSync(testFilePath, 'utf8');
console.log('\n📖 Original content:');
console.log(originalContent);

// Test conversion at line 4 (where app-tree-view starts) - using 0-based indexing
console.log('\n🔄 Converting at line 3 (0-based) which is line 4 (1-based) - app-tree-view element...');
const convertedContent = convertFunction(originalContent, testFilePath, 3);

if (convertedContent && convertedContent !== originalContent) {
    console.log('\n✅ Conversion successful!');
    console.log('\n📝 Converted content:');
    console.log(convertedContent);

    // Analyze what changed
    const originalLines = originalContent.split('\n');
    const convertedLines = convertedContent.split('\n');

    console.log('\n🔍 Line-by-line analysis:');
    const maxLines = Math.max(originalLines.length, convertedLines.length);

    for (let i = 0; i < maxLines; i++) {
        const original = originalLines[i] || '';
        const converted = convertedLines[i] || '';

        if (original !== converted) {
            console.log(`Line ${i + 1}: CHANGED`);
            console.log(`  Before: ${original}`);
            console.log(`  After:  ${converted}`);
        } else {
            console.log(`Line ${i + 1}: unchanged`);
        }
    }

    // Check if only the target element was converted
    const headerUnchanged = originalLines[1] === convertedLines[1]; // <h2>Tree Component</h2>
    const footerUnchanged = originalLines[9] === convertedLines[9]; // <p>Footer content</p>
    const containerUnchanged = originalLines[0] === convertedLines[0]; // <div class="container">

    console.log('\n🎯 Targeted conversion validation:');
    console.log(`Header unchanged: ${headerUnchanged ? '✅' : '❌'}`);
    console.log(`Footer unchanged: ${footerUnchanged ? '✅' : '❌'}`);
    console.log(`Container unchanged: ${containerUnchanged ? '✅' : '❌'}`);
    console.log(`DID IT CONVERT ONLY THE TARGETED ELEMENT? ${headerUnchanged && footerUnchanged && containerUnchanged ? '✅ YES' : '❌ NO'}`);

} else {
    console.log('\n❌ Conversion failed or no changes made');
    console.log('Converted content equals original:', convertedContent === originalContent);
}