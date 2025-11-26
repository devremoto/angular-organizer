/**
 * Angular Template Control Flow Conversion
 * Lightweight string-based transformations without heavy dependencies
 */



/**
 * Main function to convert all Angular structural directives to control flow syntax
 */
function convertAngularControlFlow(templateContent: string): string {
    let result = templateContent;

    // We need to process directives. 
    // To avoid issues with nesting and position changes, we can process them one by one.
    // We search for the first directive, convert it, and then search again from the beginning.
    // This is less efficient but safer for nested structures.

    // Directives to look for
    const directives = [
        '*ngIf',
        '*ngFor',
        '*ngSwitchCase',
        '*ngSwitchDefault',
        '[ngSwitch]'
    ];

    let found = true;
    let maxIterations = 1000; // Safety break
    let iterations = 0;

    while (found && iterations < maxIterations) {
        found = false;
        iterations++;

        // Find the first occurrence of any directive
        let firstIndex = -1;
        let firstDirective = '';

        for (const dir of directives) {
            const index = result.indexOf(dir);
            if (index !== -1) {
                if (firstIndex === -1 || index < firstIndex) {
                    firstIndex = index;
                    firstDirective = dir;
                }
            }
        }

        if (firstIndex !== -1) {
            // Found a directive. Find the element it belongs to.
            const elementRange = findElementRange(result, firstIndex);

            if (elementRange) {
                const { start, end, tagName, openTagEnd } = elementRange;
                const elementContent = result.substring(start, end);
                const openTag = result.substring(start, openTagEnd + 1);
                const innerContent = result.substring(openTagEnd + 1, end - (tagName.length + 3)); // </tagName> is length+3
                const closeTag = result.substring(end - (tagName.length + 3), end);

                let converted = elementContent;
                let matched = false;

                if (firstDirective === '*ngIf') {
                    converted = convertNgIfElement(openTag, innerContent, closeTag);
                    matched = true;
                } else if (firstDirective === '*ngFor') {
                    converted = convertNgForElement(openTag, innerContent, closeTag);
                    matched = true;
                } else if (firstDirective === '*ngSwitchCase') {
                    converted = convertNgSwitchCaseElement(openTag, innerContent, closeTag);
                    matched = true;
                } else if (firstDirective === '*ngSwitchDefault') {
                    converted = convertNgSwitchDefaultElement(openTag, innerContent, closeTag);
                    matched = true;
                } else if (firstDirective === '[ngSwitch]') {
                    converted = convertNgSwitchContainerElement(openTag, innerContent, closeTag);
                    matched = true;
                }

                if (matched && converted !== elementContent) {
                    result = result.substring(0, start) + converted + result.substring(end);
                    found = true;
                } else {
                    // If we found a directive but couldn't convert it (e.g. parsing error),
                    // we must avoid infinite loop. 
                    // We can temporarily mask this directive or skip it.
                    // For now, let's break to avoid infinite loop if we can't convert.
                    // But better: replace the directive in the string with a placeholder to skip it next time?
                    // Or just assume if we can't convert, we leave it.
                    // But then we will find it again.
                    // Let's try to replace the directive name with something else temporarily? No, that changes code.
                    // We can search *after* this index? But we modify the string.

                    // If conversion failed, we should probably skip this directive instance.
                    // But since we restart search, we need to know which one to skip.
                    // This simple "restart from top" approach fails if we can't convert one instance.

                    // Alternative: Search for all, store ranges, sort by reverse order (bottom up), and replace.
                    // But nested ranges change.

                    // Let's assume conversion always succeeds if directive is present.
                    // If it fails, we might be in trouble.
                    // Let's add a check: if converted text still contains the directive at the same place, break.
                    if (converted.includes(firstDirective)) {
                        // Force break or skip
                        // To skip, we can look for the next one.
                        // But we need to modify the loop logic.
                        // Let's just break for now to be safe.
                        console.warn(`Failed to convert ${firstDirective} at index ${firstIndex}`);
                        break;
                    }
                }
            } else {
                // Could not find element range for directive. 
                // Maybe it's in a comment or invalid HTML.
                // We should skip this occurrence.
                // To skip, we can replace it with a placeholder in 'result' but that modifies user code.
                // We can try to find the NEXT occurrence.
                // But 'result' is the string we are building.
                // If we can't process this one, we can't proceed with "restart from top".

                // Let's try to mask it?
                // result = result.substring(0, firstIndex) + "MASKED" + result.substring(firstIndex + firstDirective.length);
                // This destroys code.

                // Correct approach: Use a cursor.
                // But replacements change indices.

                // Let's stick to "restart from top" but if we fail to find range, we break to avoid infinite loop.
                break;
            }
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