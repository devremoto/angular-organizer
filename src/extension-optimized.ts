import * as vscode from 'vscode';
import { convertToControlFlow, convertStructuralDirectiveAtSpecificLine, convertToStructuralDirectives } from './template-converter.js';
import { removeCommentsExceptRegions, removeBlankLinesOutsideStrings, removeRegions } from './text-utils.js';

// Type definition for organize options
export type OrganizeOptions = {
    emitRegions?: boolean;
    optimizeMethodProximity?: boolean;
    removeUnusedImports?: boolean;
    removeUnusedVariables?: boolean;
    ensureBlankLineAfterImports?: boolean;
    cleanupCommentsOnOrganize?: boolean;
}; function getUserOptions(): { organize: OrganizeOptions; formatAfter: boolean; cleanup: boolean; rmBlanksBefore: boolean } {
    const cfg = vscode.workspace.getConfiguration('angularOrganizer');

    const cleanup = cfg.get<boolean>('cleanupCommentsOnOrganize', false);

    return {
        organize: {
            emitRegions: cfg.get<boolean>('emitRegions', false),
            optimizeMethodProximity: cfg.get<boolean>('optimizeMethodProximity', false),
            removeUnusedImports: cfg.get<boolean>('removeUnusedImports', true),
            removeUnusedVariables: cfg.get<boolean>('removeUnusedVariables', true),
            ensureBlankLineAfterImports: cfg.get<boolean>('ensureBlankLineAfterImports', true),
            cleanupCommentsOnOrganize: cleanup
        },
        formatAfter: cfg.get<boolean>('formatAfterOrganize', true),
        cleanup: cleanup,
        rmBlanksBefore: cfg.get<boolean>('removeBlankLinesBeforeOrganize', true)
    };
}

// Lightweight function for template conversion
async function runLightweightTransform(
    transform: (text: string, fileName: string, opts?: OrganizeOptions) => string,
    targetUri?: vscode.Uri,
    forceCleanup: boolean = false
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
    const effectiveCleanup = forceCleanup || cleanup;
    if (effectiveCleanup) {
        updated = removeCommentsExceptRegions(updated, doc.fileName);
    }

    // Defensive: prevent accidental comment removal
    if (
        transform === removeCommentsExceptRegions &&
        !effectiveCleanup &&
        !vscode.commands.getCommands().then(cmds => cmds.includes('angularOrganizer.removeCommentsExceptRegions'))
    ) {
        vscode.window.showErrorMessage('Comment removal is only allowed via the dedicated command or when cleanup is enabled.');
        return;
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
    targetUri?: vscode.Uri,
    forceCleanup: boolean = false,
    overrideOptions?: Partial<OrganizeOptions>
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

            // Override options if provided
            const finalOrganizeOpts = { ...organize, ...overrideOptions };

            // Pre-pass: remove blank lines (outside strings/templates)
            const pre = rmBlanksBefore ? removeBlankLinesOutsideStrings(original) : original;

            // Apply transformation
            let updated = transform(pre, doc.fileName, finalOrganizeOpts);

            // Defensive: never allow comment removal unless explicitly requested
            // (for all heavy commands)
            // If the transform is removeCommentsExceptRegions, always allow (for the dedicated command)
            // For all others, only allow if cleanup is true
            // This ensures that even if a transform is misconfigured, comments are not removed unless intended.
            const effectiveCleanup = forceCleanup || cleanup;
            if (effectiveCleanup) {
                updated = removeCommentsExceptRegions(updated, doc.fileName);
            }

            // Defensive: prevent accidental comment removal
            if (
                transform === removeCommentsExceptRegions &&
                !effectiveCleanup &&
                !vscode.commands.getCommands().then(cmds => cmds.includes('angularOrganizer.removeCommentsExceptRegions'))
            ) {
                vscode.window.showErrorMessage('Comment removal is only allowed via the dedicated command or when cleanup is enabled.');
                return;
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

/**
 * Provides code actions for organizing and refactoring Angular code.
 */
class AngularOrganizerCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.Source,
        vscode.CodeActionKind.RefactorRewrite
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        if (document.languageId === 'typescript') {
            const organizeAction = new vscode.CodeAction('Organize All (Angular Organizer)', vscode.CodeActionKind.Source);
            organizeAction.command = {
                command: 'angularOrganizer.organizeAll',
                title: 'Organize All',
                tooltip: 'Organize imports and class members'
            };
            actions.push(organizeAction);

            const cleanupAction = new vscode.CodeAction('Remove Unused Members (Angular Organizer)', vscode.CodeActionKind.RefactorRewrite);
            cleanupAction.command = {
                command: 'angularOrganizer.cleanup.unusedMembers',
                title: 'Remove Unused Members',
                tooltip: 'Remove unused private methods and properties'
            };
            actions.push(cleanupAction);
        }

        // Add "Convert to Control Flow" if we are in HTML or TS
        if (document.languageId === 'html' || document.languageId === 'typescript') {
            const convertAction = new vscode.CodeAction('Convert Current *ngIf, *ngFor, *ngSwitch to @if, @for, @switch', vscode.CodeActionKind.RefactorRewrite);
            convertAction.command = {
                command: 'angularOrganizer.convertStructuralDirectiveAtCursor',
                title: 'Convert Current *ngIf, *ngFor, *ngSwitch to @if, @for, @switch (Cursor)',
                tooltip: 'Convert structural directives to new control flow syntax'
            };
            actions.push(convertAction);

            const reverseConvertAction = new vscode.CodeAction('Convert @if, @for, @switch to *ngIf, *ngFor, *ngSwitch', vscode.CodeActionKind.RefactorRewrite);
            reverseConvertAction.command = {
                command: 'angularOrganizer.convertToStructuralDirectives',
                title: 'Convert @if, @for, @switch to *ngIf, *ngFor, *ngSwitch',
                tooltip: 'Convert new control flow syntax back to structural directives'
            };
            actions.push(reverseConvertAction);
        }

        return actions;
    }
}

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('Angular Organizer is now active!');

        // Context key management
        const updateContextKeys = () => {
            const editor = vscode.window.activeTextEditor;
            const isTs = editor?.document.languageId === 'typescript';

            let hasTemplateUrl = false;

            if (isTs) {
                const text = editor?.document.getText() || '';
                // Robust check: must have @Component and either templateUrl or template property
                const hasComponent = text.includes('@Component');
                const hasTemplateUrlProp = /templateUrl\s*:\s*['"]([^'"]+)['"]/.test(text);
                const hasInsideTemplateProp = /template\s*:\s*(["'`])/.test(text);

                hasTemplateUrl = hasComponent && (hasInsideTemplateProp);
            }

            vscode.commands.executeCommand('setContext', 'angularOrganizer.hasTemplateUrl', hasTemplateUrl);
        };

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(updateContextKeys),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === vscode.window.activeTextEditor?.document) {
                    updateContextKeys();
                }
            })
        );
        updateContextKeys();

        // Register Code Action Provider
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                ['typescript', 'html'],
                new AngularOrganizerCodeActionProvider(),
                {
                    providedCodeActionKinds: AngularOrganizerCodeActionProvider.providedCodeActionKinds
                }
            )
        );

        const cmd = (id: string, fn: (uri?: vscode.Uri) => any) =>
            context.subscriptions.push(vscode.commands.registerCommand(id, fn));

        cmd('angularOrganizer.toggleRegions', async (u) => {
            const uri = u ?? vscode.window.activeTextEditor?.document.uri;
            if (!uri) return;
            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();
            // If the code currently has regions, remove them. Otherwise, run organizeAll but force emitRegions to true.
            if (text.includes('//#region')) {
                await runLightweightTransform(removeRegions, u);
            } else {
                await runHeavyTransform('organizeAllText', u, false, { emitRegions: true });
            }
        });

        // Helper to find and run on template file if needed
        const runOnTemplateOrSelf = async (transform: (text: string, fileName: string, opts?: OrganizeOptions) => string, u?: vscode.Uri) => {
            const uri = u ?? vscode.window.activeTextEditor?.document.uri;
            if (!uri) return;

            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();

            // If we are in TS, check for templateUrl to redirect
            if (doc.languageId === 'typescript') {
                const templateUrlMatch = /templateUrl\s*:\s*['"]([^'"]+)['"]/.exec(text);

                if (templateUrlMatch && templateUrlMatch[1]) {
                    // Resolve relative path - assuming standard component structure
                    // We need the directory of current file. uri is the file.
                    // VS Code URI joining:
                    const dir = vscode.Uri.joinPath(uri, '..');
                    const templatePath = vscode.Uri.joinPath(dir, templateUrlMatch[1]);

                    try {
                        // redirect to the template file
                        await runLightweightTransform(transform, templatePath);
                        return;
                    } catch (e) {
                        vscode.window.showErrorMessage(`Could not open template file: ${templateUrlMatch[1]}`);
                    }
                }
            }

            // Fallback to normal behavior (self)
            await runLightweightTransform(transform, u);
        };

        // Lightweight commands (no ts-morph dependency)
        cmd('angularOrganizer.convertToControlFlow', (u) => runOnTemplateOrSelf(convertToControlFlow, u));
        cmd('angularOrganizer.convertToStructuralDirectives', (u) => runOnTemplateOrSelf(convertToStructuralDirectives, u));

        // For AtCursor, we can't easily redirect to a specific line in another file, so we keep it local or maybe upgrade it? 
        // Logic: if in TS with templateUrl, searching "at cursor" is ambiguous. 
        // We will leave it as is (local), assuming user might be using it on inline template or mis-clicked.
        // Or if the user really wants it enabled, maybe they have inline templates too.
        cmd('angularOrganizer.convertStructuralDirectiveAtCursor', () => convertStructuralDirectiveAtCursor());

        cmd('angularOrganizer.removeCommentsExceptRegions', (u) => runLightweightTransform(removeCommentsExceptRegions, u));
        cmd('angularOrganizer.removeRegions', (u) => runLightweightTransform(removeRegions, u));
        cmd('angularOrganizer.cleanup.unusedMembers', (u) => runHeavyTransform('removeUnusedMembersOnly', u));

        // Heavy commands (require ts-morph - dynamically loaded)
        cmd('angularOrganizer.sortImports', (u) => runHeavyTransform('sortImportsOnly', u));
        cmd('angularOrganizer.reorder.allMembers', (u) => runHeavyTransform('reorderAllMembers', u));
        cmd('angularOrganizer.organizeAll', (u) => runHeavyTransform('organizeAllText', u));
        cmd('angularOrganizer.organizeAllWithCleanup', (u) => runHeavyTransform('organizeAllText', u, true));
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