/**
 * Angular Template Control Flow Conversion
 * Lightweight string-based transformations without heavy dependencies
 */

/**
 * Convert *ngFor directives to @for control flow with proper element wrapping
 * Examples:
 * <li *ngFor="let item of items">{{ item }}</li> -> @for (item of items; track item) { <li>{{ item }}</li> }
 * <div *ngFor="let item of items; let i = index">{{ i }}</div> -> @for (item of items; track item; let i = $index) { <div>{{ i }}</div> }
 */
function convertNgForToAtFor(templateContent: string): string {
    // More sophisticated approach - find and match elements properly (including hyphenated element names)
    const ngForPattern = /(<([\w-]+)[^>]*?\*ngFor\s*=\s*["']([^"']+)["'][^>]*?>)([\s\S]*?)(<\/\2>)/g;

    return templateContent.replace(ngForPattern, (match, openTag, tagName, forExpression, content, closeTag) => {
        // Parse the for expression
        const parts = forExpression.split(';').map((p: string) => p.trim());
        const mainPart = parts[0]; // "let item of items"

        // Extract variable and iterable from main part
        const mainMatch = mainPart.match(/let\s+(\w+)\s+of\s+(.+)/);
        if (!mainMatch) return match; // If we can't parse, leave unchanged

        const [, variable, iterable] = mainMatch;

        // Handle additional options
        let trackExpression = variable; // default track by item
        let indexVariable = '';

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();

            if (part.startsWith('let ') && part.includes('= index')) {
                // Handle index variable: "let i = index"
                const indexMatch = part.match(/let\s+(\w+)\s*=\s*index/);
                if (indexMatch) {
                    indexVariable = indexMatch[1];
                }
            } else if (part.startsWith('trackBy:')) {
                // Handle trackBy function: "trackBy: trackByFn"
                const trackByMatch = part.match(/trackBy:\s*(.+)/);
                if (trackByMatch) {
                    const trackByFn = trackByMatch[1].trim();
                    trackExpression = `${trackByFn}(${variable})`;
                }
            }
        }

        // Build the @for expression
        let forResult = `@for (${variable} of ${iterable}; track ${trackExpression}`;
        if (indexVariable) {
            forResult += `; let ${indexVariable} = $index`;
        }
        forResult += ') {\n';

        // Remove the *ngFor attribute from the opening tag
        const cleanOpenTag = openTag.replace(/\s*\*ngFor\s*=\s*["'][^"']+["']/, '');

        // Wrap the element in the @for block - preserve the original content structure
        forResult += `  ${cleanOpenTag}${content}${closeTag}\n`;
        forResult += '}';

        return forResult;
    });
}

/**
 * Convert *ngIf directives to @if control flow with proper element wrapping
 * Examples:
 * <p *ngIf="condition">Content</p> -> @if (condition) { <p>Content</p> }
 * <div *ngIf="condition; else elseTemplate">Content</div> -> @if (condition) { <div>Content</div> } @else { }
 * <span *ngIf="condition as alias">Content</span> -> @if (condition; as alias) { <span>Content</span> }
 */
function convertNgIfToAtIf(templateContent: string): string {
    // More sophisticated pattern to match elements properly (including hyphenated element names)
    const ngIfElementPattern = /(<([\w-]+)[^>]*?\*ngIf\s*=\s*["']([^"']+)["'][^>]*?>)([\s\S]*?)(<\/\2>)/g;

    return templateContent.replace(ngIfElementPattern, (match, openTag, tagName, ifExpression, content, closeTag) => {
        // Handle "else" clause
        let ifResult = '';
        if (ifExpression.includes(';') && ifExpression.includes('else')) {
            const parts = ifExpression.split(';').map((p: string) => p.trim());
            const condition = parts[0];

            // Check for "as alias" pattern
            const asMatch = condition.match(/(.+)\s+as\s+(\w+)/);
            if (asMatch) {
                const [, actualCondition, alias] = asMatch;
                ifResult = `@if (${actualCondition}; as ${alias}) {\n`;
            } else {
                ifResult = `@if (${condition}) {\n`;
            }
        } else {
            // Handle "as alias" pattern without else
            const asMatch = ifExpression.match(/(.+)\s+as\s+(\w+)/);
            if (asMatch) {
                const [, condition, alias] = asMatch;
                ifResult = `@if (${condition}; as ${alias}) {\n`;
            } else {
                // Simple condition
                ifResult = `@if (${ifExpression}) {\n`;
            }
        }

        // Remove the *ngIf attribute from the opening tag
        const cleanOpenTag = openTag.replace(/\s*\*ngIf\s*=\s*["'][^"']+["']/, '');

        // Wrap the element in the @if block
        ifResult += `  ${cleanOpenTag}${content}${closeTag}\n`;
        ifResult += '}';

        return ifResult;
    });
}

/**
 * Convert *ngSwitchCase and *ngSwitchDefault elements (process children first)
 */
function convertNgSwitchChildrenToAtSwitch(templateContent: string): string {
    let result = templateContent;

    // First, convert *ngSwitchCase elements with proper wrapping using improved regex (including hyphenated element names)
    const ngSwitchCasePattern = /(<([\w-]+)[^>]*?\*ngSwitchCase\s*=\s*"([^"]*)"[^>]*?>)([\s\S]*?)(<\/\2>)/g;
    result = result.replace(ngSwitchCasePattern, (match, openTag, tagName, caseValue, content, closeTag) => {
        const cleanOpenTag = openTag.replace(/\s*\*ngSwitchCase\s*=\s*"[^"]*"/, '');
        return `@case (${caseValue}) {\n  ${cleanOpenTag}${content}${closeTag}\n}`;
    });

    const ngSwitchCasePatternSingle = /(<([\w-]+)[^>]*?\*ngSwitchCase\s*=\s*'([^']*)'[^>]*?>)([\s\S]*?)(<\/\2>)/g;
    result = result.replace(ngSwitchCasePatternSingle, (match, openTag, tagName, caseValue, content, closeTag) => {
        const cleanOpenTag = openTag.replace(/\s*\*ngSwitchCase\s*=\s*'[^']*'/, '');
        return `@case (${caseValue}) {\n  ${cleanOpenTag}${content}${closeTag}\n}`;
    });

    // Convert *ngSwitchDefault elements with proper wrapping using improved regex (including hyphenated element names)
    const ngSwitchDefaultPattern = /(<([\w-]+)[^>]*?\*ngSwitchDefault[^>]*?>)([\s\S]*?)(<\/\2>)/g;
    result = result.replace(ngSwitchDefaultPattern, (match, openTag, tagName, content, closeTag) => {
        const cleanOpenTag = openTag.replace(/\s*\*ngSwitchDefault/, '');
        return `@default {\n  ${cleanOpenTag}${content}${closeTag}\n}`;
    });

    return result;
}

/**
 * Convert [ngSwitch] container elements (process after children are converted)
 */
function convertNgSwitchContainerToAtSwitch(templateContent: string): string {
    // Convert [ngSwitch] container elements and wrap the content using improved regex (including hyphenated element names)
    const ngSwitchPattern = /(<([\w-]+)[^>]*?\[ngSwitch\]\s*=\s*"([^"]+)"[^>]*?>)([\s\S]*?)(<\/\2>)/g;
    return templateContent.replace(ngSwitchPattern, (match, openTag, tagName, switchExpression, content, closeTag) => {
        // Clean up the content by removing extra whitespace from nested @case/@default blocks
        const cleanContent = content.trim();
        return `@switch (${switchExpression}) {\n${cleanContent}\n}`;
    });
}

/**
 * Main function to convert all Angular structural directives to control flow syntax
 */
function convertAngularControlFlow(templateContent: string): string {
    let result = templateContent;

    // Process ngSwitch child elements FIRST (before the container)
    result = convertNgSwitchChildrenToAtSwitch(result);

    // Then process other directives
    result = convertNgForToAtFor(result);
    result = convertNgIfToAtIf(result);

    // Finally process ngSwitch containers (after children are already converted)
    result = convertNgSwitchContainerToAtSwitch(result);

    return result;
}

/**
 * Convert Angular template from structural directives to control flow syntax
 * This function works on template files (.html) and inline templates in components
 */
export function convertToControlFlow(fileText: string, filePath: string): string {
    // Check if this is a template file
    if (filePath.endsWith('.html')) {
        return convertAngularControlFlow(fileText);
    }

    // For TypeScript files, look for inline templates
    if (filePath.endsWith('.ts')) {
        // Pattern to match template properties in components
        const templatePattern = /(template\s*:\s*)(["'`])([^]*?)\2/g;

        return fileText.replace(templatePattern, (match, prefix, quote, templateContent) => {
            const convertedTemplate = convertAngularControlFlow(templateContent);
            return `${prefix}${quote}${convertedTemplate}${quote}`;
        });
    }

    return fileText;
}

/**
 * Convert Angular structural directive at a specific line (cursor-based conversion)
 * This function finds and converts only the element containing a structural directive at the given line
 */
export function convertStructuralDirectiveAtSpecificLine(
    fileText: string,
    filePath: string,
    cursorLine: number
): string {
    const lines = fileText.split('\n');

    // For HTML files, find the element that spans around the cursor line
    if (filePath.endsWith('.html')) {
        return convertSpecificElementInHtml(lines, cursorLine);
    }

    // For TypeScript files, check if we're inside a template
    if (filePath.endsWith('.ts')) {
        return convertSpecificElementInTypeScript(fileText, cursorLine);
    }

    return fileText;
}

/**
 * Convert specific element in HTML file at cursor line
 */
function convertSpecificElementInHtml(lines: string[], cursorLine: number): string {
    const content = lines.join('\n');

    // Find the element that contains a structural directive and spans the cursor line
    const elementMatch = findElementAtLine(content, cursorLine);

    if (elementMatch) {
        const { startIndex, endIndex, elementText } = elementMatch;

        // Check if this element has structural directives
        if (hasStructuralDirective(elementText)) {
            // Convert just this element
            const convertedElement = convertAngularControlFlow(elementText);

            // Replace only this element in the content
            const before = content.substring(0, startIndex);
            const after = content.substring(endIndex);

            return before + convertedElement + after;
        }
    }

    return content;
}

/**
 * Convert specific element in TypeScript template at cursor line
 */
function convertSpecificElementInTypeScript(fileText: string, cursorLine: number): string {
    // Similar logic for TypeScript files with inline templates
    const templateInfo = findTemplateAtPosition(fileText, cursorLine, 0);

    if (templateInfo) {
        const templateLines = templateInfo.templateContent.split('\n');
        const fileLines = fileText.split('\n');

        // Calculate relative position within template
        let templateStartLine = 0;
        let pos = 0;

        for (let i = 0; i < fileLines.length; i++) {
            if (pos + fileLines[i].length >= templateInfo.templateStart) {
                templateStartLine = i;
                break;
            }
            pos += fileLines[i].length + 1;
        }

        const relativeLineInTemplate = cursorLine - templateStartLine;

        if (relativeLineInTemplate >= 0 && relativeLineInTemplate < templateLines.length) {
            const convertedTemplate = convertSpecificElementInHtml(templateLines, relativeLineInTemplate);

            if (convertedTemplate !== templateLines.join('\n')) {
                // Replace the template in the original file
                const before = fileText.substring(0, templateInfo.templateStart - 1);
                const after = fileText.substring(templateInfo.templateEnd + 1);

                return before + templateInfo.quote + convertedTemplate + templateInfo.quote + after;
            }
        }
    }

    return fileText;
}

/**
 * Find the complete element (opening tag to closing tag) that spans a specific line
 */
function findElementAtLine(content: string, targetLine: number): { startIndex: number; endIndex: number; elementText: string } | null {
    const lines = content.split('\n');

    // First, check if the target line itself contains a structural directive
    const targetLineContent = lines[targetLine];
    if (hasStructuralDirective(targetLineContent)) {
        // This line has a structural directive, find the complete element it belongs to
        return findCompleteElementFromLine(content, targetLine);
    }

    // If target line doesn't have directive, look nearby for elements that might span this line
    for (let offset = 0; offset <= 3; offset++) {
        // Check above
        if (targetLine - offset >= 0 && hasStructuralDirective(lines[targetLine - offset])) {
            const element = findCompleteElementFromLine(content, targetLine - offset);
            if (element && elementSpansLine(element, content, targetLine)) {
                return element;
            }
        }

        // Check below
        if (targetLine + offset < lines.length && hasStructuralDirective(lines[targetLine + offset])) {
            const element = findCompleteElementFromLine(content, targetLine + offset);
            if (element && elementSpansLine(element, content, targetLine)) {
                return element;
            }
        }
    }

    return null;
}

/**
 * Find complete element starting from a line that contains structural directive
 */
function findCompleteElementFromLine(content: string, lineWithDirective: number): { startIndex: number; endIndex: number; elementText: string } | null {
    const lines = content.split('\n');
    const lineContent = lines[lineWithDirective];

    // First, try to extract tag name from the same line (for inline cases)
    let tagMatch = lineContent.match(/<([\w-]+)[\s\S]*?\*ng/);
    let tagName: string | null = null;

    if (tagMatch) {
        tagName = tagMatch[1];
    } else {
        // If not found on same line, look backwards for the opening tag
        for (let i = lineWithDirective; i >= 0; i--) {
            const line = lines[i];
            const openTagMatch = line.match(/<([\w-]+)(?:\s|$|>)/);
            if (openTagMatch) {
                tagName = openTagMatch[1];
                break;
            }
        }
    }

    if (!tagName) return null;

    // Find the start of this element (look for the opening tag)
    let startLine = lineWithDirective;
    for (let i = lineWithDirective; i >= 0; i--) {
        if (lines[i].includes(`<${tagName}`)) {
            startLine = i;
            break;
        }
    }

    // Find the end of this element
    let endLine = lineWithDirective;
    let depth = 0;
    let foundClosing = false;

    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        // Count opening tags
        const openingTags = (line.match(new RegExp(`<${tagName}[\\s>]`, 'g')) || []).length;
        depth += openingTags;

        // Count closing tags
        const closingTags = (line.match(new RegExp(`</${tagName}>`, 'g')) || []).length;
        depth -= closingTags;

        if (depth === 0 && closingTags > 0) {
            endLine = i;
            foundClosing = true;
            break;
        }

        // Handle self-closing tags
        if (line.includes(`<${tagName}`) && line.includes('/>')) {
            endLine = i;
            foundClosing = true;
            break;
        }
    }

    if (!foundClosing) return null;

    // Calculate character positions
    let startIndex = 0;
    for (let i = 0; i < startLine; i++) {
        startIndex += lines[i].length + 1; // +1 for newline
    }

    let endIndex = startIndex;
    for (let i = startLine; i <= endLine; i++) {
        endIndex += lines[i].length;
        if (i < endLine) endIndex += 1; // +1 for newline
    }

    const elementText = content.substring(startIndex, endIndex);

    return { startIndex, endIndex, elementText };
}

/**
 * Check if an element spans a specific line
 */
function elementSpansLine(element: { startIndex: number; endIndex: number; elementText: string }, content: string, targetLine: number): boolean {
    const lines = content.split('\n');
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineStart = currentIndex;
        const lineEnd = currentIndex + lines[i].length;

        if (i === targetLine) {
            // Check if the element overlaps with this line
            return element.startIndex <= lineEnd && element.endIndex >= lineStart;
        }

        currentIndex = lineEnd + 1; // +1 for newline
    }

    return false;
}

/**
 * Check if an element contains structural directives
 */
function hasStructuralDirective(elementText: string): boolean {
    return /\*ng(For|If|Switch)|(\[ngSwitch\])|(\*ngSwitchCase)|(\*ngSwitchDefault)/.test(elementText);
}

/**
 * Find template boundaries at a given position in TypeScript file
 */
function findTemplateAtPosition(fileText: string, line: number, char: number): {
    templateStart: number;
    templateEnd: number;
    templateContent: string;
    prefix: string;
    quote: string;
} | null {
    const lines = fileText.split('\n');
    let targetPos = 0;

    // Calculate the absolute position from line/char
    for (let i = 0; i < line; i++) {
        targetPos += lines[i].length + 1; // +1 for newline
    }
    targetPos += char;

    // Look for template: patterns
    const templatePattern = /(template\s*:\s*)(["'`])([^]*?)\2/g;
    let match;

    while ((match = templatePattern.exec(fileText)) !== null) {
        const matchStart = match.index + match[1].length + 1; // Start of template content
        const matchEnd = match.index + match[0].length - 1; // End of template content

        if (targetPos >= matchStart && targetPos <= matchEnd) {
            return {
                templateStart: matchStart,
                templateEnd: matchEnd,
                templateContent: match[3],
                prefix: match[1],
                quote: match[2]
            };
        }
    }

    return null;
}

/**
 * Convert structural directives in specific lines of HTML template
 */
function convertLinesWithStructuralDirectives(
    lines: string[],
    startLine: number,
    endLine: number,
    startChar: number,
    endChar: number
): string {
    const result = [...lines];

    for (let i = startLine; i <= Math.min(endLine, lines.length - 1); i++) {
        const line = lines[i];

        // Check if this line contains structural directives
        if (line.includes('*ngFor') || line.includes('*ngIf') || line.includes('*ngSwitch') ||
            line.includes('[ngSwitch]') || line.includes('*ngSwitchCase') || line.includes('*ngSwitchDefault')) {

            // If we're on the start line, only convert from startChar onwards
            // If we're on the end line, only convert up to endChar
            let lineToConvert = line;
            let prefix = '';
            let suffix = '';

            if (i === startLine && i === endLine) {
                // Same line selection
                prefix = line.substring(0, startChar);
                lineToConvert = line.substring(startChar, endChar);
                suffix = line.substring(endChar);
            } else if (i === startLine) {
                prefix = line.substring(0, startChar);
                lineToConvert = line.substring(startChar);
            } else if (i === endLine) {
                lineToConvert = line.substring(0, endChar);
                suffix = line.substring(endChar);
            }

            const converted = convertAngularControlFlow(lineToConvert);
            result[i] = prefix + converted + suffix;
        }
    }

    return result.join('\n');
}

/**
 * Convert structural directive in inline template at specific position
 */
function convertInlineTemplateAtPosition(
    fileText: string,
    templateInfo: { templateStart: number; templateEnd: number; templateContent: string; prefix: string; quote: string },
    startLine: number,
    endLine: number,
    startChar: number,
    endChar: number
): string {
    // Convert the template content
    const templateLines = templateInfo.templateContent.split('\n');

    // Calculate relative position within template
    const fileLines = fileText.split('\n');
    let templateStartLine = 0;
    let pos = 0;

    for (let i = 0; i < fileLines.length; i++) {
        if (pos + fileLines[i].length >= templateInfo.templateStart) {
            templateStartLine = i;
            break;
        }
        pos += fileLines[i].length + 1;
    }

    const relativeStartLine = Math.max(0, startLine - templateStartLine);
    const relativeEndLine = Math.min(templateLines.length - 1, endLine - templateStartLine);

    const convertedTemplate = convertLinesWithStructuralDirectives(
        templateLines,
        relativeStartLine,
        relativeEndLine,
        startChar,
        endChar
    );

    // Replace the template in the original file
    const before = fileText.substring(0, templateInfo.templateStart - 1);
    const after = fileText.substring(templateInfo.templateEnd + 1);

    return before + templateInfo.quote + convertedTemplate + templateInfo.quote + after;
}