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

            // Get indentation for the element
            const lastNewLine = result.lastIndexOf('\n', start - 1);
            const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
            const indentation = result.substring(lineStart, start).match(/^\s*/)?.[0] || '';

            let innerContent = '';
            let closeTag = '';

            // Only parse inner content if it's not a self-closing tag
            // For self-closing tags, end equals openTagEnd + 1
            if (end > openTagEnd + 1) {
                innerContent = result.substring(openTagEnd + 1, end - (tagName.length + 3)); // </tagName> is length+3
                closeTag = result.substring(end - (tagName.length + 3), end);
            }

            let convertedText = elementContent;
            let matched = false;

            if (firstDirective === '*ngIf') {
                convertedText = convertNgIfElement(openTag, innerContent, closeTag, indentation);
                matched = true;
            } else if (firstDirective === '*ngFor') {
                convertedText = convertNgForElement(openTag, innerContent, closeTag, indentation);
                matched = true;
            } else if (firstDirective === '*ngSwitchCase') {
                convertedText = convertNgSwitchCaseElement(openTag, innerContent, closeTag, indentation);
                matched = true;
            } else if (firstDirective === '*ngSwitchDefault') {
                convertedText = convertNgSwitchDefaultElement(openTag, innerContent, closeTag, indentation);
                matched = true;
            } else if (firstDirective === '[ngSwitch]') {
                convertedText = convertNgSwitchContainerElement(openTag, innerContent, closeTag, indentation);
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

function convertNgIfElement(openTag: string, innerContent: string, closeTag: string, baseIndent: string = ''): string {
    const ifExpression = getAttribute(openTag, '*ngIf');
    if (!ifExpression) return openTag + innerContent + closeTag;

    let condition = ifExpression;

    // Handle "else" clause (simplified: we just keep the condition part for @if)
    if (ifExpression.includes(';') && ifExpression.includes('else')) {
        const parts = ifExpression.split(';').map((p: string) => p.trim());
        condition = parts[0];
    }

    // Handle "as alias" pattern
    const asMatch = condition.match(/(.+)\s+as\s+(\w+)/);
    if (asMatch) {
        const [, actualCondition, alias] = asMatch;
        condition = `${actualCondition}; as ${alias}`;
    }

    const cleanOpenTag = removeAttribute(openTag, '*ngIf');

    const indentStep = '  ';
    // Indent the content
    const element = `${cleanOpenTag}${innerContent}${closeTag}`;
    const indentedElement = element.replace(/\n/g, `\n${indentStep}`);

    return `@if (${condition}) {\n${baseIndent}${indentStep}${indentedElement}\n${baseIndent}}`;
}

function convertNgForElement(openTag: string, innerContent: string, closeTag: string, baseIndent: string = ''): string {
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

    const indentStep = '  ';
    // Indent the content
    const element = `${cleanOpenTag}${innerContent}${closeTag}`;
    const indentedElement = element.replace(/\n/g, `\n${indentStep}`);

    forResult += `${baseIndent}${indentStep}${indentedElement}\n${baseIndent}}`;
    return forResult;
}

function convertNgSwitchCaseElement(openTag: string, innerContent: string, closeTag: string, baseIndent: string = ''): string {
    const caseValue = getAttribute(openTag, '*ngSwitchCase');
    if (!caseValue) return openTag + innerContent + closeTag;

    const cleanOpenTag = removeAttribute(openTag, '*ngSwitchCase');

    const indentStep = '  ';
    // Indent the content
    const element = `${cleanOpenTag}${innerContent}${closeTag}`;
    const indentedElement = element.replace(/\n/g, `\n${indentStep}`);

    return `@case (${caseValue}) {\n${baseIndent}${indentStep}${indentedElement}\n${baseIndent}}`;
}

function convertNgSwitchDefaultElement(openTag: string, innerContent: string, closeTag: string, baseIndent: string = ''): string {
    const cleanOpenTag = removeAttribute(openTag, '*ngSwitchDefault');

    const indentStep = '  ';
    // Indent the content
    const element = `${cleanOpenTag}${innerContent}${closeTag}`;
    const indentedElement = element.replace(/\n/g, `\n${indentStep}`);

    return `@default {\n${baseIndent}${indentStep}${indentedElement}\n${baseIndent}}`;
}

function convertNgSwitchContainerElement(openTag: string, innerContent: string, closeTag: string, baseIndent: string = ''): string {
    const switchExpression = getAttribute(openTag, '[ngSwitch]');
    if (!switchExpression) return openTag + innerContent + closeTag;

    // For container, we remove the container element and wrap content in @switch
    // The inner content usually contains elements with *ngSwitchCase which are indented
    // relative to this container. Since we remove the container but add @switch wrapper,
    // the relative indentation is preserved, effectively.
    // However, we should ensure the closing brace is indented correctly.

    return `@switch (${switchExpression}) {\n${innerContent}\n${baseIndent}}`;
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

    // Check if self-closing (explicit with />)
    if (content[openTagEnd - 1] === '/') {
        return { start: startIndex, end: openTagEnd + 1, tagName, openTagEnd };
    }

    // Check if void element (implicit self-closing without /)
    // These elements cannot have content, so we treat them as self-closing
    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    if (voidTags.includes(tagName.toLowerCase())) {
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

    // Look backwards from targetLine to find the opening tag of the element containing this line
    // We look back up to 100 lines to find the start of the tag
    for (let i = targetLine; i >= Math.max(0, targetLine - 100); i--) {
        const line = lines[i];
        // Find all opening tags on this line: <tagName followed by something that is not a tag character
        const openMatches = Array.from(line.matchAll(/<([\w-]+)(?![\w-])/g));

        // Check tags in reverse order (last one on the line is the most likely candidate)
        for (let j = openMatches.length - 1; j >= 0; j--) {
            const tagName = openMatches[j][1];
            const element = findCompleteElement(content, i, tagName);

            if (element && elementSpansLine(element, content, targetLine)) {
                // Found an element that spans the target line.
                // Check if it has a structural directive.
                if (hasStructuralDirective(element.elementText)) {
                    return element;
                }
            }
        }
    }

    return null;
}

/**
 * Find complete element starting from a specific line and tag name
 */
function findCompleteElement(content: string, startLine: number, tagName: string): { startIndex: number; endIndex: number; elementText: string } | null {
    const lines = content.split('\n');

    // Find the end of this element
    let endLine = startLine;
    let depth = 0;
    let foundClosing = false;

    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        // Count opening tags
        const openingTags = (line.match(new RegExp(`<${tagName}(?![\\w-])`, 'g')) || []).length;
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
 * Convert Angular control flow syntax (@if, @for, @switch) back to structural directives
 */
export function convertToStructuralDirectives(templateContent: string, filePath?: string): string {
    // For TypeScript files, look for inline templates
    if (filePath && filePath.endsWith('.ts')) {
        // Pattern to match template properties in components
        const templatePattern = /(template\s*:\s*)(["'`])([^]*?)\2/g;

        return templateContent.replace(templatePattern, (match, prefix, quote, innerContent) => {
            const convertedTemplate = convertToStructuralDirectives(innerContent); // Recursive call for just the content
            return `${prefix}${quote}${convertedTemplate}${quote}`;
        });
    }

    let result = templateContent;

    // Safety break for infinite loops
    let maxIterations = 500;
    let iterations = 0;

    // We process from inside out or just repeatedly until no more @ keywords are found
    // that can be converted.
    while (iterations < maxIterations) {
        iterations++;

        // Find the first @if, @for, or @switch
        const keywords = ['@if', '@for', '@switch'];
        let firstIndex = -1;
        let firstKeyword = '';

        for (const kw of keywords) {
            const idx = result.indexOf(kw);
            if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
                // Ensure it's not inside a string or already converted
                // Simple check: must be preceded by whitespace, newline, or start of string
                if (idx === 0 || /[\s\n\r}]/.test(result[idx - 1])) {
                    firstIndex = idx;
                    firstKeyword = kw;
                }
            }
        }

        if (firstIndex === -1) break;

        const block = findControlFlowBlock(result, firstIndex);
        if (!block) {
            // Skip this one if we can't parse it
            // We need a way to mark it as "processed" if it's invalid
            // For now, let's just break to avoid infinite loop if parsing fails
            break;
        }

        let converted = '';
        if (block.type === '@if') {
            converted = convertIfBlockToDirective(block.expression, block.blockContent);
        } else if (block.type === '@for') {
            converted = convertForBlockToDirective(block.expression, block.blockContent);
        } else if (block.type === '@switch') {
            converted = convertSwitchBlockToDirective(block.expression, block.blockContent);
        }

        if (converted) {
            result = result.substring(0, block.start) + converted + result.substring(block.end);
        } else {
            // If we couldn't convert it, skip it in next iteration
            // This is a bit hacky but works for a simple string-based converter
            break;
        }
    }

    return result;
}

function findControlFlowBlock(content: string, startIndex: number): {
    start: number,
    end: number,
    type: string,
    expression: string,
    blockContent: string
} | null {
    const remaining = content.substring(startIndex);
    const match = remaining.match(/^(@if|@for|@switch)\s*\((.*?)\)\s*\{/s);
    if (!match) return null;

    const type = match[1];
    const expression = match[2];
    const openBraceIndex = startIndex + match[0].length - 1;

    const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
    if (closeBraceIndex === -1) return null;

    return {
        start: startIndex,
        end: closeBraceIndex + 1,
        type,
        expression,
        blockContent: content.substring(openBraceIndex + 1, closeBraceIndex)
    };
}

function findMatchingBrace(content: string, openBraceIndex: number): number {
    let depth = 1;
    for (let i = openBraceIndex + 1; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function convertIfBlockToDirective(expression: string, content: string): string {
    // Preserve whitespace around the content
    const match = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
    let leadingWs = match ? match[1] : '';
    const actualContent = match ? match[2] : '';
    let trailingWs = match ? match[3] : '';

    // Clean up surrounding whitespace to remove the "ghost" of the @if block lines
    // If leading whitespace contains a newline, we remove one level of newline/indentation
    if (leadingWs.includes('\n')) {
        leadingWs = leadingWs.replace(/^\r?\n\s*/, ' ');
        // We replace with a space just in case, or empty string. 
        // Better: if the block was multiline, we trust the inner content indentation
        // but we want to strip the initial break that separated @if from content.
    }

    // Simplification strategy: 
    // If the content is multiline, it likely has its own indentation that matches the start of @if.
    // If we just return `actualContent`, it might be enough if we strip the bookending newlines.

    // Refined approach: just use the whitespace that was *before* the element inside the block
    // but without the initial newline if it exists.
    const wsMatch = leadingWs.match(/(\r?\n\s*)$/);
    if (wsMatch) {
        // If there's a newline at the end of leadingWs, stripped it to avoid double newline
        leadingWs = leadingWs.substring(0, leadingWs.length - wsMatch[1].length);
        // And if led by newline, strip that too
    }

    // Simplest: just trim the vertical buffers
    leadingWs = leadingWs.replace(/^\r?\n/, '');
    trailingWs = trailingWs.replace(/\r?\n\s*$/, '');

    // If it's a single element, put *ngIf on it
    if (isSingleElement(actualContent)) {
        return leadingWs + addAttributeToElement(actualContent, '*ngIf', expression) + trailingWs;
    }
    // Otherwise wrap in ng-container
    // For ng-container wrapper, we might want to preserve the structure if it was multiline
    return `<ng-container *ngIf="${expression}">${content}</ng-container>`;
}

function convertForBlockToDirective(expression: string, content: string): string {
    // expression is like "item of items; track item.id"
    // we want "let item of items"
    const parts = expression.split(';').map(p => p.trim());
    const mainPart = parts[0];
    let structuralFor = `let ${mainPart}`;

    // Handle explicit index variable if present (e.g. let i = $index)
    for (const part of parts.slice(1)) {
        if (part.startsWith('let ') && part.includes('= $index')) {
            const match = part.match(/let\s+(\w+)\s*=\s*\$index/);
            if (match) {
                structuralFor += `; let ${match[1]} = index`;
            }
        }
    }

    // Preserve whitespace around the content
    const match = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
    let leadingWs = match ? match[1] : '';
    const actualContent = match ? match[2] : '';
    let trailingWs = match ? match[3] : '';

    // Cleanup whitespace
    leadingWs = leadingWs.replace(/^\r?\n/, '');
    trailingWs = trailingWs.replace(/\r?\n\s*$/, '');

    if (isSingleElement(actualContent)) {
        return leadingWs + addAttributeToElement(actualContent, '*ngFor', structuralFor) + trailingWs;
    }
    return `<ng-container *ngFor="${structuralFor}">${content}</ng-container>`;
}

function convertSwitchBlockToDirective(expression: string, content: string): string {
    let inner = content;

    // Convert @case
    inner = inner.replace(/@case\s*\((.*?)\)\s*\{([^]*?)\}/g, (m, exp, cont) => {
        const match = cont.match(/^(\s*)([\s\S]*?)(\s*)$/);
        let leadingWs = match ? match[1] : '';
        const actualContent = match ? match[2] : '';
        let trailingWs = match ? match[3] : '';

        // Cleanup whitespace
        leadingWs = leadingWs.replace(/^\r?\n/, '');
        trailingWs = trailingWs.replace(/\r?\n\s*$/, '');

        if (isSingleElement(actualContent)) {
            return leadingWs + addAttributeToElement(actualContent, '*ngSwitchCase', exp) + trailingWs;
        }
        return `<ng-container *ngSwitchCase="${exp}">${cont}</ng-container>`;
    });

    // Convert @default
    inner = inner.replace(/@default\s*\{([^]*?)\}/g, (m, cont) => {
        const match = cont.match(/^(\s*)([\s\S]*?)(\s*)$/);
        let leadingWs = match ? match[1] : '';
        const actualContent = match ? match[2] : '';
        let trailingWs = match ? match[3] : '';

        // Cleanup whitespace
        leadingWs = leadingWs.replace(/^\r?\n/, '');
        trailingWs = trailingWs.replace(/\r?\n\s*$/, '');

        if (isSingleElement(actualContent)) {
            return leadingWs + addAttributeToElement(actualContent, '*ngSwitchDefault', '') + trailingWs;
        }
        return `<ng-container *ngSwitchDefault>${cont}</ng-container>`;
    });

    return `<ng-container [ngSwitch]="${expression}">${inner}</ng-container>`;
}

function isSingleElement(content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed.startsWith('<')) return false;

    // Get tag name
    const tagMatch = trimmed.match(/^<([\w-]+)/);
    if (!tagMatch) return false;
    const tagName = tagMatch[1];

    let depth = 0;
    let index = 0;

    while (index < trimmed.length) {
        // Find next < of interest
        const openIndex = trimmed.indexOf('<', index);
        if (openIndex === -1) break;

        // Check closing first </tagName>
        if (trimmed.startsWith(`</${tagName}>`, openIndex)) {
            depth--;
            index = openIndex + tagName.length + 3;

            if (depth === 0) {
                // If we closed the root, we must be at the end
                return index === trimmed.length;
            }
        }
        // Check opening <tagName
        else if (trimmed.startsWith(`<${tagName}`, openIndex)) {
            // Check boundary: next char must be space, slash or >
            const charAfter = trimmed[openIndex + 1 + tagName.length];
            if (/[\s\/>]/.test(charAfter)) {
                // Scan to end of tag to check for self-closing
                let innerInQuote = false;
                let innerQuote = '';
                let tagEnd = -1;

                for (let k = openIndex + 1 + tagName.length; k < trimmed.length; k++) {
                    const c = trimmed[k];
                    if (innerInQuote) {
                        if (c === innerQuote) innerInQuote = false;
                    } else {
                        if (c === '"' || c === "'") {
                            innerInQuote = true;
                            innerQuote = c;
                        } else if (c === '>') {
                            tagEnd = k;
                            break;
                        }
                    }
                }

                if (tagEnd !== -1) {
                    if (trimmed[tagEnd - 1] === '/') {
                        // Self closing
                        if (openIndex === 0) {
                            // If root is self closing, it must match whole string
                            return tagEnd === trimmed.length - 1;
                        }
                        // Nested self-closing, depth unchanged
                        index = tagEnd + 1;
                    } else {
                        // Normal opening
                        depth++;
                        index = tagEnd + 1;
                    }
                } else {
                    // Malformed tag, abort
                    return false;
                }
            } else {
                // Not our tag (e.g. <div vs <divider)
                index = openIndex + 1;
            }
        } else {
            // Other tag
            index = openIndex + 1;
        }
    }

    return false;
}

function addAttributeToElement(elementText: string, attrName: string, attrValue: string): string {
    const firstTagEnd = elementText.indexOf('>');
    if (firstTagEnd === -1) return elementText;

    const isSelfClosing = elementText[firstTagEnd - 1] === '/';
    const insertPos = isSelfClosing ? firstTagEnd - 1 : firstTagEnd;

    const before = elementText.substring(0, insertPos);
    const after = elementText.substring(insertPos);

    const valuePart = attrValue ? `="${attrValue}"` : '';

    // If 'before' already ends with whitespace, don't add another space
    const separator = /\s$/.test(before) ? '' : ' ';

    return `${before}${separator}${attrName}${valuePart}${after}`;
}

