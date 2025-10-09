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

console.log('\n🧪 Debugging app-tree-view conversion...');
console.log('File:', testFilePath);

// Read original content
const originalContent = fs.readFileSync(testFilePath, 'utf8');
const lines = originalContent.split('\n');

console.log('\n📖 Line-by-line content:');
lines.forEach((line, index) => {
    const lineNum = index + 1;
    const hasNgIf = line.includes('*ngIf');
    const hasAppTreeView = line.includes('app-tree-view');
    console.log(`Line ${lineNum}: ${hasNgIf ? '[*ngIf]' : ''}${hasAppTreeView ? '[app-tree-view]' : ''} "${line}"`);
});

// Test different lines
console.log('\n🔄 Testing conversion on different lines...');

// Note: The function expects 0-based line indexing, but we displayed 1-based
for (let testLine = 3; testLine <= 6; testLine++) {
    console.log(`\n--- Testing line ${testLine} (0-based) = line ${testLine + 1} (1-based) ---`);
    const result = convertFunction(originalContent, testFilePath, testLine);
    const changed = result !== originalContent;
    console.log(`Line ${testLine} (0-based): ${changed ? '✅ CONVERTED' : '❌ NO CHANGE'}`);

    if (changed) {
        console.log('Converted content preview:');
        const convertedLines = result.split('\n');
        convertedLines.forEach((line, index) => {
            if (line !== lines[index]) {
                console.log(`  Line ${index + 1}: CHANGED to "${line}"`);
            }
        });
        break; // Stop on first successful conversion
    }
}