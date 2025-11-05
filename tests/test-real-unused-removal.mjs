import { organizeAllText } from '../out/organize.js';
import * as fs from 'fs';

console.log('✅ Successfully imported organization function');

// Read the signal subgroup example file
const filePath = 'tests/signal-subgroup-example.component.ts';
const originalContent = fs.readFileSync(filePath, 'utf8');

console.log('🧪 Testing unused removal on real file...');
console.log('📖 Original content:');
console.log('--- ORIGINAL ---');
console.log(originalContent);

console.log('\n🔄 Organizing with unused removal...');

try {
    const organized = organizeAllText(originalContent, filePath);

    console.log('\n✅ Organization complete!');
    console.log('\n📝 Organized content:');
    console.log('--- ORGANIZED ---');
    console.log(organized);

    // Write organized content for comparison
    fs.writeFileSync('tests/signal-subgroup-example.with-unused-removal.ts', organized);

    console.log('\n📁 Organized content written to: tests/signal-subgroup-example.with-unused-removal.ts');

} catch (error) {
    console.error('❌ Error during organization:', error);
}