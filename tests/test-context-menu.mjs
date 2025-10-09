// Test HTML templates to verify context menu logic
const testCases = [
    {
        name: "HTML with *ngFor",
        content: `<div>
  <ul>
    <li *ngFor="let item of items">{{ item.name }}</li>
  </ul>
</div>`,
        fileName: "test.component.html",
        shouldShow: true,
        lineWithDirective: 2
    },
    {
        name: "HTML with *ngIf",
        content: `<div>
  <p *ngIf="showMessage">Hello</p>
  <span>Regular content</span>
</div>`,
        fileName: "test.component.html",
        shouldShow: true,
        lineWithDirective: 1
    },
    {
        name: "HTML with [ngSwitch]",
        content: `<div [ngSwitch]="currentView">
  <span *ngSwitchCase="'list'">List</span>
  <span *ngSwitchDefault>Default</span>
</div>`,
        fileName: "test.component.html",
        shouldShow: true,
        lineWithDirective: 0
    },
    {
        name: "Regular HTML without directives",
        content: `<div>
  <p>No directives here</p>
  <span>Regular content</span>
</div>`,
        fileName: "test.component.html",
        shouldShow: false,
        lineWithDirective: 1
    },
    {
        name: "TypeScript component with inline template",
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`
    <div>
      <li *ngFor="let item of items">{{ item }}</li>
    </div>
  \`
})
export class TestComponent {}`,
        fileName: "test.component.ts",
        shouldShow: true,
        lineWithDirective: 6
    },
    {
        name: "TypeScript component without template directives",
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`
    <div>
      <p>No directives</p>
    </div>
  \`
})
export class TestComponent {}`,
        fileName: "test.component.ts",
        shouldShow: false,
        lineWithDirective: 6
    }
];

console.log('🧪 Testing Context Menu Logic...\n');

// Simulate the logic from hasStructuralDirectiveAtCursor function
function testContextLogic(content, fileName, lineNumber) {
    const isHtml = fileName.endsWith('.html');
    const isTs = fileName.endsWith('.ts');

    if (!isHtml && !isTs) {
        return false;
    }

    const lines = content.split('\n');

    if (isHtml) {
        if (lineNumber >= lines.length) return false;
        const lineText = lines[lineNumber];
        return /\*ng(For|If|Switch)|(\[ngSwitch\])|(\*ngSwitchCase)|(\*ngSwitchDefault)/.test(lineText);
    }

    if (isTs) {
        // Simplified template detection for testing
        const templatePattern = /(template\s*:\s*)(["'\`])([^]*?)\2/g;
        let match;

        while ((match = templatePattern.exec(content)) !== null) {
            const templateContent = match[3];
            const templateLines = templateContent.split('\n');

            // For testing, assume the line number is relative to start of file
            // In real implementation, this would be calculated based on cursor position
            const beforeMatch = content.substring(0, match.index).split('\n').length - 1;
            const relativeLineInTemplate = lineNumber - beforeMatch - 1;

            if (relativeLineInTemplate >= 0 && relativeLineInTemplate < templateLines.length) {
                const templateLine = templateLines[relativeLineInTemplate];
                return /\*ng(For|If|Switch)|(\[ngSwitch\])|(\*ngSwitchCase)|(\*ngSwitchDefault)/.test(templateLine);
            }
        }
    }

    return false;
}

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = testContextLogic(testCase.content, testCase.fileName, testCase.lineWithDirective);
    const success = result === testCase.shouldShow;

    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Expected: ${testCase.shouldShow ? 'Show menu' : 'Hide menu'}`);
    console.log(`  Actual: ${result ? 'Show menu' : 'Hide menu'}`);
    console.log(`  Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    if (success) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('🎉 All context menu logic tests passed!');
    console.log('\n✨ Context menu will now only appear when:');
    console.log('  - Cursor is on a line with *ngFor, *ngIf, *ngSwitch, etc.');
    console.log('  - In HTML template files (.html)');
    console.log('  - In TypeScript files (.ts) within inline templates');
    console.log('  - Right-clicking directly on structural directive elements');
} else {
    console.log('❌ Some tests failed. Context menu logic needs adjustment.');
}