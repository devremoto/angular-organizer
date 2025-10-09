import * as vscode from 'vscode';
import { convertToControlFlow, convertStructuralDirectiveAtSpecificLine } from './template-converter.js';
import { removeCommentsExceptRegions, removeBlankLinesOutsideStrings } from './text-utils.js';

// Type definition for organize options
export type OrganizeOptions = {
    emitRegions?: boolean;
    optimizeMethodProximity?: boolean;
}; function getUserOptions(): { organize: OrganizeOptions; formatAfter: boolean; cleanup: boolean; rmBlanksBefore: boolean } {
    const cfg = vscode.workspace.getConfiguration('angularOrganizer');
    return {
        organize: {
            emitRegions: cfg.get<boolean>('emitRegions', true),
            optimizeMethodProximity: cfg.get<boolean>('optimizeMethodProximity', false)
        },
        formatAfter: cfg.get<boolean>('formatAfterOrganize', true),
        cleanup: cfg.get<boolean>('cleanupCommentsOnOrganize', false),
        rmBlanksBefore: cfg.get<boolean>('removeBlankLinesBeforeOrganize', true)
    };
}

// Lightweight function for template conversion
async function runLightweightTransform(
    transform: (text: string, fileName: string, opts?: OrganizeOptions) => string,
    targetUri?: vscode.Uri
) {
    const uri = targetUri ?? vscode.window.activeTextEditor?.document.uri;
    if (!uri) return;

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);

    const { organize, formatAfter, cleanup, rmBlanksBefore } = getUserOptions();
    const original = doc.getText();

    // Pre-pass: remove blank lines (outside strings/templates)
    const pre = rmBlanksBefore ? removeBlankLinesOutsideStrings(original) : original;

    // Apply transformation
    let updated = transform(pre, doc.fileName, organize);

    // Optional: comment cleanup (keeps //#region only)
    if (cleanup) {
        updated = removeCommentsExceptRegions(updated, doc.fileName);
    }

    if (updated !== original) {
        const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(original.length));
        await editor.edit(e => e.replace(fullRange, updated));
    } else {
        vscode.window.showInformationMessage('Angular Organizer: nothing to change.');
    }

    if (formatAfter) {
        try { await vscode.commands.executeCommand('editor.action.formatDocument'); } catch { }
    }
}

// Heavy function that dynamically imports ts-morph functionality
async function runHeavyTransform(
    transformName: string,
    targetUri?: vscode.Uri
) {
    // Show a loading message since this will take time to load
    const loading = vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Loading TypeScript parsing functionality...",
        cancellable: false
    }, async () => {
        try {
            // Dynamically import the heavy organize module only when needed
            const organizeModule = require('./organize.js');

            // Get the specific transform function
            const transform = (organizeModule as any)[transformName];
            if (!transform) {
                vscode.window.showErrorMessage(`Transform function '${transformName}' not found.`);
                return;
            }

            const uri = targetUri ?? vscode.window.activeTextEditor?.document.uri;
            if (!uri) return;

            const doc = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(doc);

            const { organize, formatAfter, cleanup, rmBlanksBefore } = getUserOptions();
            const original = doc.getText();

            // Pre-pass: remove blank lines (outside strings/templates)
            const pre = rmBlanksBefore ? removeBlankLinesOutsideStrings(original) : original;

            // Apply transformation
            let updated = transform(pre, doc.fileName, organize);

            // Optional: comment cleanup (keeps //#region only)
            if (cleanup) {
                updated = removeCommentsExceptRegions(updated, doc.fileName);
            }

            if (updated !== original) {
                const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(original.length));
                await editor.edit(e => e.replace(fullRange, updated));
            } else {
                vscode.window.showInformationMessage('Angular Organizer: nothing to change.');
            }

            if (formatAfter) {
                try { await vscode.commands.executeCommand('editor.action.formatDocument'); } catch { }
            }
        } catch (error) {
            console.error('Error loading heavy transform:', error);
            vscode.window.showErrorMessage('Failed to load TypeScript parsing functionality. Make sure organize.js is available.');
        }
    });

    await loading;
}

async function convertStructuralDirectiveAtCursor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const cursorLine = selection.start.line;
    const original = document.getText();

    // Find the specific element containing structural directive at cursor position
    const updated = convertStructuralDirectiveAtSpecificLine(original, document.fileName, cursorLine);

    if (updated !== original) {
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(original.length));
        await editor.edit(e => e.replace(fullRange, updated));
        vscode.window.showInformationMessage('✨ Structural directive converted to control flow syntax!');
    } else {
        vscode.window.showInformationMessage('No structural directive found at cursor position.');
    }

    // Format the document after conversion
    try {
        await vscode.commands.executeCommand('editor.action.formatDocument');
    } catch (error) {
        // Ignore formatting errors
    }
}

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('Angular Organizer is now active!');

        const cmd = (id: string, fn: (uri?: vscode.Uri) => any) =>
            context.subscriptions.push(vscode.commands.registerCommand(id, fn));

        // Lightweight commands (no ts-morph dependency)
        cmd('angularOrganizer.convertToControlFlow', (u) => runLightweightTransform(convertToControlFlow, u));
        cmd('angularOrganizer.convertStructuralDirectiveAtCursor', () => convertStructuralDirectiveAtCursor());
        cmd('angularOrganizer.removeCommentsExceptRegions', (u) => runLightweightTransform(removeCommentsExceptRegions, u));

        // Heavy commands (require ts-morph - dynamically loaded)
        cmd('angularOrganizer.sortImports', (u) => runHeavyTransform('sortImportsOnly', u));
        cmd('angularOrganizer.reorder.allMembers', (u) => runHeavyTransform('reorderAllMembers', u));
        cmd('angularOrganizer.organizeAll', (u) => runHeavyTransform('organizeAllText', u));
        cmd('angularOrganizer.organizeAllWithProximity', (u) => runHeavyTransform('organizeAllTextWithProximity', u));

        cmd('angularOrganizer.reorder.constants', (u) => runHeavyTransform('reorderConstantsOnly', u));
        cmd('angularOrganizer.reorder.privateFields', (u) => runHeavyTransform('reorderPrivateFieldsOnly', u));
        cmd('angularOrganizer.reorder.protectedFields', (u) => runHeavyTransform('reorderProtectedFieldsOnly', u));

        cmd('angularOrganizer.reorder.inputs', (u) => runHeavyTransform('reorderInputsOnly', u));
        cmd('angularOrganizer.reorder.inputSetters', (u) => runHeavyTransform('reorderInputSettersOnly', u));
        cmd('angularOrganizer.reorder.outputs', (u) => runHeavyTransform('reorderOutputsOnly', u));
        cmd('angularOrganizer.reorder.viewQueries', (u) => runHeavyTransform('reorderViewQueriesOnly', u));

        cmd('angularOrganizer.reorder.accessors', (u) => runHeavyTransform('reorderAccessorsOnly', u));
        cmd('angularOrganizer.reorder.ctor', (u) => runHeavyTransform('reorderCtorOnly', u));

        cmd('angularOrganizer.reorder.publicMethods', (u) => runHeavyTransform('reorderPublicMethodsOnly', u));
        cmd('angularOrganizer.reorder.protectedMethods', (u) => runHeavyTransform('reorderProtectedMethodsOnly', u));
        cmd('angularOrganizer.reorder.privateMethods', (u) => runHeavyTransform('reorderPrivateMethodsOnly', u));

        console.log('Angular Organizer commands registered.');
    } catch (error) {
        console.error('Error during Angular Organizer activation:', error);
        vscode.window.showErrorMessage('Angular Organizer: Error during activation. Check console for details.', JSON.stringify(error) || String(error));
    }
}

export function deactivate() { }