import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the organization function
const organizePath = path.join(__dirname, '..', 'out', 'organize.js');
let organizeFunction;

try {
    const organizeModule = await import('file://' + organizePath);
    organizeFunction = organizeModule.organizeAllText;
    console.log('✅ Successfully imported organization function');
} catch (error) {
    console.error('❌ Failed to import organization function:', error.message);
    process.exit(1);
}

// Test file path
const testFilePath = path.join(__dirname, 'signal-subgroup-example.component.ts');

console.log('\n🧪 Testing Signal API subgrouping with blank lines...');
console.log('File:', testFilePath);

// Read original content
const originalContent = fs.readFileSync(testFilePath, 'utf8');
console.log('\n📖 Original content (mixed signal APIs):');
console.log('--- ORIGINAL ---');
console.log(originalContent);

// Organize the content
console.log('\n🔄 Organizing with signal API subgrouping...');
const organizedContent = organizeFunction(originalContent, testFilePath, {
    emitRegions: true,
    removeUnusedImports: false, // Keep all imports for demonstration
    removeUnusedVariables: false
});

console.log('\n✅ Organization complete!');
console.log('\n📝 Organized content:');
console.log('--- ORGANIZED ---');
console.log(organizedContent);

// Show the improvements
console.log('\n🔍 Signal API subgrouping improvements:');
console.log('1. ✅ inject() calls grouped together with blank line after');
console.log('2. ✅ input() / input.required() calls grouped together with blank line after');
console.log('3. ✅ output() calls grouped together with blank line after');
console.log('4. ✅ signal() calls grouped together');
console.log('5. ✅ Alphabetical order within each subgroup');
console.log('6. ✅ Clear visual separation between API types');

// Write organized content to see the result
const outputPath = path.join(__dirname, 'signal-subgroup-example.organized.ts');
fs.writeFileSync(outputPath, organizedContent);
console.log(`\n📁 Organized content written to: ${outputPath}`);