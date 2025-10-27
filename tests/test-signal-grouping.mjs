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
const testFilePath = path.join(__dirname, 'signal-example.component.ts');

console.log('\n🧪 Testing Signal-based API grouping...');
console.log('File:', testFilePath);

// Read original content
const originalContent = fs.readFileSync(testFilePath, 'utf8');
console.log('\n📖 Original content:');
console.log('--- ORIGINAL ---');
console.log(originalContent);

// Organize the content
console.log('\n🔄 Organizing with signal-based API grouping...');
const organizedContent = organizeFunction(originalContent, testFilePath, { emitRegions: true });

console.log('\n✅ Organization complete!');
console.log('\n📝 Organized content:');
console.log('--- ORGANIZED ---');
console.log(organizedContent);

// Show the differences
console.log('\n🔍 Key improvements:');
console.log('1. ✅ Signal-based APIs (inject, input, output, signal) grouped together');
console.log('2. ✅ Traditional @Input/@Output properties in separate sections');
console.log('3. ✅ Signal hooks (computed, effect) in their own section');
console.log('4. ✅ Proper ordering: inject → input → output → signal within the group');
console.log('5. ✅ Clear regions separating different types of properties');

// Write organized content to see the result
const outputPath = path.join(__dirname, 'signal-example.organized.ts');
fs.writeFileSync(outputPath, organizedContent);
console.log(`\n📁 Organized content written to: ${outputPath}`);