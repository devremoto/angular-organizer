import * as vscode from 'vscode';
import {
  sortImportsOnly,
  organizeAllText,
  organizeAllTextWithProximity,
  reorderAllMembers,
  reorderConstantsOnly,
  reorderPrivateFieldsOnly,
  reorderProtectedFieldsOnly,
  reorderInputsOnly,
  reorderInputSettersOnly,
  reorderOutputsOnly,
  reorderViewQueriesOnly,
  reorderAccessorsOnly,
  reorderCtorOnly,
  reorderPublicMethodsOnly,
  reorderProtectedMethodsOnly,
  reorderPrivateMethodsOnly,
  OrganizeOptions,
  removeCommentsExceptRegions,
  removeBlankLinesOutsideStrings,
  convertToControlFlow,
  convertStructuralDirectiveAtPosition
} from './organize.js';

function getUserOptions(): { organize: OrganizeOptions; formatAfter: boolean; cleanup: boolean; rmBlanksBefore: boolean } {
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

async function runOnDoc(
  transform: (text: string, fileName: string, opts?: OrganizeOptions) => string,
  targetUri?: vscode.Uri
) {
  const uri = targetUri ?? vscode.window.activeTextEditor?.document.uri;
  if (!uri) return;

  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);

  const { organize, formatAfter, cleanup, rmBlanksBefore } = getUserOptions();

  const original = doc.getText();

  // 🔹 PRE-PASS: remove blank lines (outside strings/templates)
  const pre = rmBlanksBefore ? removeBlankLinesOutsideStrings(original) : original;

  // organize
  let updated = transform(pre, doc.fileName, organize);

  // optional: comment cleanup (keeps //#region only)
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

async function convertStructuralDirectiveAtCursor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const document = editor.document;
  const selection = editor.selection;

  // Get the selection or cursor position
  const startPos = selection.start;
  const endPos = selection.end;

  // Get the text around cursor to check if it contains structural directives
  const line = document.lineAt(startPos.line);
  const lineText = line.text;

  // Check if the current line or selection contains structural directives
  const hasStructuralDirective = /\*ng(For|If|Switch)|(\[ngSwitch\])|(\*ngSwitchCase)|(\*ngSwitchDefault)/.test(lineText);

  if (!hasStructuralDirective) {
    vscode.window.showInformationMessage('No Angular structural directive found at cursor position.');
    return;
  }

  const original = document.getText();

  // Convert the structural directive at the specific position
  const updated = convertStructuralDirectiveAtPosition(
    original,
    document.fileName,
    startPos.line,
    endPos.line,
    startPos.character,
    endPos.character
  );

  if (updated !== original) {
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(original.length));
    await editor.edit(e => e.replace(fullRange, updated));
    vscode.window.showInformationMessage('Angular structural directive converted to control flow syntax.');
  } else {
    vscode.window.showInformationMessage('No changes were made.');
  }

  // Format the document after conversion
  try {
    await vscode.commands.executeCommand('editor.action.formatDocument');
  } catch {
    // Ignore formatting errors
  }
}

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('Angular Organizer is now active!');
    const cmd = (id: string, fn: (uri?: vscode.Uri) => any) =>
      context.subscriptions.push(vscode.commands.registerCommand(id, fn));

    cmd('angularOrganizer.sortImports', (u) => runOnDoc(sortImportsOnly, u));
    cmd('angularOrganizer.reorder.allMembers', (u) => runOnDoc(reorderAllMembers, u));
    cmd('angularOrganizer.organizeAll', (u) => runOnDoc(organizeAllText, u));
    cmd('angularOrganizer.organizeAllWithProximity', (u) => runOnDoc(organizeAllTextWithProximity, u));

    cmd('angularOrganizer.reorder.constants', (u) => runOnDoc(reorderConstantsOnly, u));
    cmd('angularOrganizer.reorder.privateFields', (u) => runOnDoc(reorderPrivateFieldsOnly, u));
    cmd('angularOrganizer.reorder.protectedFields', (u) => runOnDoc(reorderProtectedFieldsOnly, u));

    cmd('angularOrganizer.reorder.inputs', (u) => runOnDoc(reorderInputsOnly, u));
    cmd('angularOrganizer.reorder.inputSetters', (u) => runOnDoc(reorderInputSettersOnly, u));
    cmd('angularOrganizer.reorder.outputs', (u) => runOnDoc(reorderOutputsOnly, u));
    cmd('angularOrganizer.reorder.viewQueries', (u) => runOnDoc(reorderViewQueriesOnly, u));

    cmd('angularOrganizer.reorder.accessors', (u) => runOnDoc(reorderAccessorsOnly, u));
    cmd('angularOrganizer.reorder.ctor', (u) => runOnDoc(reorderCtorOnly, u));

    cmd('angularOrganizer.reorder.publicMethods', (u) => runOnDoc(reorderPublicMethodsOnly, u));
    cmd('angularOrganizer.reorder.protectedMethods', (u) => runOnDoc(reorderProtectedMethodsOnly, u));
    cmd('angularOrganizer.reorder.privateMethods', (u) => runOnDoc(reorderPrivateMethodsOnly, u));
    cmd('angularOrganizer.removeCommentsExceptRegions', (u) => runOnDoc(removeCommentsExceptRegions, u));
    cmd('angularOrganizer.convertToControlFlow', (u) => runOnDoc(convertToControlFlow, u));
    cmd('angularOrganizer.convertStructuralDirectiveAtCursor', () => convertStructuralDirectiveAtCursor());
    console.log('Angular Organizer commands registered.');
  } catch (error) {
    console.error('Error during Angular Organizer activation:', error);
    vscode.window.showErrorMessage('Angular Organizer: Error during activation. Check console for details.', JSON.stringify(error) || String(error));
  }
}

export function deactivate() { }
