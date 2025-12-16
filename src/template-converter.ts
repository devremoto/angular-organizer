/**
 * Angular Template Control Flow Conversion
 * Lightweight string-based transformations without heavy dependencies
 */



/**
 * Main function to convert all Angular structural directives to control flow syntax
 */
function convertAngularControlFlow(templateContent: string): string {
    let result = templateContent;

    // Directives to look for
    const directives = [
        '*ngIf',
        '*ngFor',
        '*ngSwitchCase',
        '*ngSwitchDefault',
        '[ngSwitch]'
    ];

    let maxIterations = 1000; // Safety break
    let iterations = 0;
    let searchStartIndex = 0;

    while (iterations < maxIterations) {
        iterations++;

        // Find the first occurrence of any directive AFTER searchStartIndex
        let firstIndex = -1;
        let firstDirective = '';

        for (const dir of directives) {
            const index = result.indexOf(dir, searchStartIndex);
            if (index !== -1) {
                if (firstIndex === -1 || index < firstIndex) {
                    firstIndex = index;
                    firstDirective = dir;
                }
            }
        }

        if (firstIndex === -1) {
            // No more directives found
            break;
        }

        // Found a directive at firstIndex. Find the element it belongs to.
        const elementRange = findElementRange(result, firstIndex);
        let converted = false;

        if (elementRange) {
            const { start, end, tagName, openTagEnd } = elementRange;
            const elementContent = result.substring(start, end);
            const openTag = result.substring(start, openTagEnd + 1);
            const innerContent = result.substring(openTagEnd + 1, end - (tagName.length + 3)); // </tagName> is length+3
            const closeTag = result.substring(end - (tagName.length + 3), end);

            let convertedText = elementContent;
            let matched = false;

            if (firstDirective === '*ngIf') {
                convertedText = convertNgIfElement(openTag, innerContent, closeTag);
                matched = true;
            } else if (firstDirective === '*ngFor') {
                convertedText = convertNgForElement(openTag, innerContent, closeTag);
                matched = true;
            } else if (firstDirective === '*ngSwitchCase') {
                convertedText = convertNgSwitchCaseElement(openTag, innerContent, closeTag);
                matched = true;
            } else if (firstDirective === '*ngSwitchDefault') {
                convertedText = convertNgSwitchDefaultElement(openTag, innerContent, closeTag);
                matched = true;
            } else if (firstDirective === '[ngSwitch]') {
                convertedText = convertNgSwitchContainerElement(openTag, innerContent, closeTag);
                matched = true;
            }

            if (matched && convertedText !== elementContent) {
                result = result.substring(0, start) + convertedText + result.substring(end);
                converted = true;
            }
        }

        if (converted) {
            // If we modified the string, we must restart search from 0
            // because the modification might have shifted things or created new opportunities.
            // Since the directive is replaced, we won't find it again at the same place.
            searchStartIndex = 0;
        } else {
            // If we didn't convert (false positive, comment, text, or parsing fail),
            // we must skip this occurrence.
            searchStartIndex = firstIndex + 1;
        }
    }

    return result;
}

function convertNgIfElement(openTag: string, innerContent: string, closeTag: string): string {
    const ifExpression = getAttribute(openTag, '*ngIf');
    if (!ifExpression) return openTag + innerContent + closeTag;

    let ifResult = '';
    // Handle "else" clause
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

    const cleanOpenTag = removeAttribute(openTag, '*ngIf');
    ifResult += `  ${cleanOpenTag}${innerContent}${closeTag}\n`;
    ifResult += '}';
    return ifResult;
}

function convertNgForElement(openTag: string, innerContent: string, closeTag: string): string {
    const forExpression = getAttribute(openTag, '*ngFor');
    if (!forExpression) return openTag + innerContent + closeTag;

    const parts = forExpression.split(';').map((p: string) => p.trim());
    const mainPart = parts[0]; // "let item of items"

    const mainMatch = mainPart.match(/let\s+(\w+)\s+of\s+(.+)/);
    if (!mainMatch) return openTag + innerContent + closeTag;

    const [, variable, iterable] = mainMatch;

    let trackExpression = variable;
    let indexVariable = '';

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith('let ') && part.includes('= index')) {
            const indexMatch = part.match(/let\s+(\w+)\s*=\s*index/);
            if (indexMatch) indexVariable = indexMatch[1];
        } else if (part.startsWith('trackBy:')) {
            const trackByMatch = part.match(/trackBy:\s*(.+)/);
            if (trackByMatch) {
                const trackByFn = trackByMatch[1].trim();
                trackExpression = `${trackByFn}(${variable})`;
            }
        }
    }

    let forResult = `@for (${variable} of ${iterable}; track ${trackExpression}`;
    if (indexVariable) {
        forResult += `; let ${indexVariable} = $index`;
    }
    forResult += ') {\n';

    const cleanOpenTag = removeAttribute(openTag, '*ngFor');
    forResult += `  ${cleanOpenTag}${innerContent}${closeTag}\n`;
    forResult += '}';
    return forResult;
}

function convertNgSwitchCaseElement(openTag: string, innerContent: string, closeTag: string): string {
    const caseValue = getAttribute(openTag, '*ngSwitchCase');
    if (!caseValue) return openTag + innerContent + closeTag;

    const cleanOpenTag = removeAttribute(openTag, '*ngSwitchCase');
    return `@case (${caseValue}) {\n  ${cleanOpenTag}${innerContent}${closeTag}\n}`;
}

function convertNgSwitchDefaultElement(openTag: string, innerContent: string, closeTag: string): string {
    const cleanOpenTag = removeAttribute(openTag, '*ngSwitchDefault');
    return `@default {\n  ${cleanOpenTag}${innerContent}${closeTag}\n}`;
}

function convertNgSwitchContainerElement(openTag: string, innerContent: string, closeTag: string): string {
    const switchExpression = getAttribute(openTag, '[ngSwitch]');
    if (!switchExpression) return openTag + innerContent + closeTag;

    // For container, we remove the container element and wrap content in @switch
    const cleanContent = innerContent.trim();
    return `@switch (${switchExpression}) {\n${cleanContent}\n}`;
}

function getAttribute(tag: string, attributeName: string): string | null {
    const escapedName = attributeName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 's');
    const match = tag.match(regex);
    return match ? match[2] : null;
}

function removeAttribute(tag: string, attributeName: string): string {
    const escapedName = attributeName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\s*${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'gs');
    let result = tag.replace(regex, '');
    const bareRegex = new RegExp(`\\s*${escapedName}(?=[\\s/>])`, 'g');
    result = result.replace(bareRegex, '');
    return result;
}

function findElementRange(content: string, directiveIndex: number): { start: number, end: number, tagName: string, openTagEnd: number } | null {
    // Find start of the opening tag (search backwards from directiveIndex)
    let startIndex = -1;
    let tagName = '';

    for (let i = directiveIndex; i >= 0; i--) {
        if (content[i] === '<' && /[a-zA-Z]/.test(content[i + 1])) {
            let j = i + 1;
            while (j < content.length && /[\w-]/.test(content[j])) j++;
            tagName = content.substring(i + 1, j);
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) return null;

    // Find end of opening tag
    let openTagEnd = -1;
    let inQuote = false;
    let quoteChar = '';
    for (let i = startIndex; i < content.length; i++) {
        const char = content[i];
        if (inQuote) {
            if (char === quoteChar) inQuote = false;
        } else {
            if (char === '"' || char === "'") {
                inQuote = true;
                quoteChar = char;
            } else if (char === '>') {
                openTagEnd = i;
                break;
            }
        }
    }

    if (openTagEnd === -1) return null;

    // Check if self-closing
    if (content[openTagEnd - 1] === '/') {
        return { start: startIndex, end: openTagEnd + 1, tagName, openTagEnd };
    }

    // Find closing tag with depth counting
    let depth = 1;
    let currentIndex = openTagEnd + 1;

    while (currentIndex < content.length) {
        const nextTagIndex = content.indexOf('<', currentIndex);
        if (nextTagIndex === -1) break;

        if (content.startsWith(`</${tagName}>`, nextTagIndex)) {
            depth--;
            if (depth === 0) {
                return {
                    start: startIndex,
                    end: nextTagIndex + `</${tagName}>`.length,
                    tagName,
                    openTagEnd
                };
            }
            currentIndex = nextTagIndex + 1;
        }
        else if (content.startsWith(`<${tagName}`, nextTagIndex)) {
            const charAfter = content[nextTagIndex + 1 + tagName.length];
            if (/[\s/>]/.test(charAfter)) {
                let innerTagEnd = -1;
                let innerInQuote = false;
                let innerQuoteChar = '';
                for (let k = nextTagIndex; k < content.length; k++) {
                    if (innerInQuote) {
                        if (content[k] === innerQuoteChar) innerInQuote = false;
                    } else {
                        if (content[k] === '"' || content[k] === "'") {
                            innerInQuote = true;
                            innerQuoteChar = content[k];
                        } else if (content[k] === '>') {
                            innerTagEnd = k;
                            break;
                        }
                    }
                }

                if (innerTagEnd !== -1) {
                    if (content[innerTagEnd - 1] !== '/') {
                        depth++;
                    }
                    currentIndex = innerTagEnd + 1;
                } else {
                    currentIndex = nextTagIndex + 1;
                }
            } else {
                currentIndex = nextTagIndex + 1;
            }
        } else {
            currentIndex = nextTagIndex + 1;
        }
    }

    return null;
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

