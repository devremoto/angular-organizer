/**
 * Lightweight text utilities without heavy dependencies
 */

/**
 * Remove comments except //#region and //#endregion
 */
export function removeCommentsExceptRegions(
    fileText: string,
    _filePath: string
): string {
    const lines = fileText.split('\n');
    const result: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Keep //#region and //#endregion comments
        if (trimmed.startsWith('//#region') || trimmed.startsWith('//#endregion')) {
            result.push(line);
            continue;
        }

        // Check if we're inside a string to avoid removing comments inside strings
        let inString = false;
        let stringChar = '';
        let inTemplate = false;
        let beforeComment = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (!inString && !inTemplate) {
                if (char === '"' || char === "'") {
                    inString = true;
                    stringChar = char;
                } else if (char === '`') {
                    inTemplate = true;
                } else if (char === '/' && nextChar === '/') {
                    // Found a comment outside of strings - keep everything before it
                    break;
                }
            } else if (inString && char === stringChar && line[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            } else if (inTemplate && char === '`' && line[i - 1] !== '\\') {
                inTemplate = false;
            }

            beforeComment += char;
        }

        // Count quotes to make sure we're balanced
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        const templateQuotes = (beforeComment.match(/`/g) || []).length;

        // Only remove the comment if we're not inside a string
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && templateQuotes % 2 === 0) {
            result.push(beforeComment.trimEnd());
        } else {
            // We're inside a string, keep the original line
            result.push(line);
        }
    }

    return result.join('\n');
}

/**
 * Remove blank lines that are OUTSIDE of strings/template literals. Safe for inline templates.
 */
export function removeBlankLinesOutsideStrings(fileText: string): string {
    // Simple tokenization approach using TypeScript's built-in scanner would be too heavy
    // Use a lightweight regex-based approach instead

    const lines = fileText.split('\n');
    const result: string[] = [];

    let inMultilineString = false;
    let stringDelimiter = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Handle multiline strings/templates
        if (!inMultilineString) {
            // Check if this line starts a multiline string
            const templateMatch = line.match(/[`]/g);
            const singleQuoteMatch = line.match(/['"]/g);

            if (templateMatch && templateMatch.length % 2 === 1) {
                inMultilineString = true;
                stringDelimiter = '`';
            } else if (singleQuoteMatch) {
                // Simple heuristic: if odd number of quotes, might be multiline
                const singleQuotes = (line.match(/'/g) || []).length;
                const doubleQuotes = (line.match(/"/g) || []).length;

                if (singleQuotes % 2 === 1) {
                    inMultilineString = true;
                    stringDelimiter = "'";
                } else if (doubleQuotes % 2 === 1) {
                    inMultilineString = true;
                    stringDelimiter = '"';
                }
            }
        } else {
            // Check if this line ends the multiline string
            if (line.includes(stringDelimiter)) {
                const matches = (line.match(new RegExp(`\\${stringDelimiter}`, 'g')) || []).length;
                if (matches % 2 === 1) {
                    inMultilineString = false;
                    stringDelimiter = '';
                }
            }
        }

        // If we're in a multiline string or the line is not empty, keep it
        if (inMultilineString || trimmedLine !== '') {
            result.push(line);
        }
    }

    return result.join('\n');
}