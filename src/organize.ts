import { Project, SourceFile, ClassDeclaration, Node } from 'ts-morph';
import * as ts from 'typescript';



export type OrganizeOptions = {
  emitRegions?: boolean; // default true
  optimizeMethodProximity?: boolean; // default false - move methods closer to their usage
  removeUnusedImports?: boolean; // default true - remove unused imports
  removeUnusedVariables?: boolean; // default true - remove unused variables and methods
  ensureBlankLineAfterImports?: boolean; // default true - ensure blank line after imports
};

/* ========= Public API (each command calls one of these) ========= */

// Imports only
export function sortImportsOnly(fileText: string, filePath: string): string {
  const sf = createSource(fileText, filePath);
  const options = withDefaults();

  // Remove unused imports
  if (options.removeUnusedImports) {
    removeUnusedImports(sf);
  }

  // Sort imports (includes blank line after imports)
  sortImports(sf);

  return sf.getFullText();
}// Members only (all buckets)
export function reorderAllMembers(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const sf = createSource(fileText, filePath);
  const options = withDefaults(opts);

  // Remove unused variables
  if (options.removeUnusedVariables) {
    removeUnusedVariables(sf);
  }

  // Reorder class members
  reorderAngularClasses(sf, options);

  return sf.getFullText();
}

// Imports + members
export function organizeAllText(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const sf = createSource(fileText, filePath);
  const options = withDefaults(opts);

  // Remove unused imports and variables first
  removeUnusedImportsAndVariables(sf, options);

  // Sort imports (includes blank line after imports)
  sortImports(sf);

  // Reorder class members
  reorderAngularClasses(sf, options);

  return sf.getFullText();
}// Organize with method proximity optimization
export function organizeAllTextWithProximity(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const mergedOpts = { ...opts, optimizeMethodProximity: true };
  return organizeAllText(fileText, filePath, mergedOpts);
}

// Convenience “Only” exports — they all do the full member reorder
export const reorderConstantsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderPrivateFieldsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderProtectedFieldsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderInputsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderInputSettersOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderOutputsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderViewQueriesOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderAccessorsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderCtorOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderPublicMethodsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderProtectedMethodsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);
export const reorderPrivateMethodsOnly = (t: string, p: string, o?: OrganizeOptions) => reorderMembers(t, p, o);

export function removeCommentsExceptRegions(
  fileText: string,
  _filePath: string
): string {
  const lines = fileText.split('\n');
  const result: string[] = [];

  const isRegionLine = (line: string) => {
    const trimmed = line.trim();
    // Match lines like: // #region Something or // #endregion Something
    return /^\s*\/\/\s*#(?:end)?region\b/i.test(trimmed);
  };

  let inMultiLineComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle multi-line comment continuation
    if (inMultiLineComment) {
      if (line.includes('*/')) {
        // End of multi-line comment found
        const endIndex = line.indexOf('*/');
        line = line.substring(endIndex + 2); // Keep everything after */
        inMultiLineComment = false;

        // Continue processing the rest of the line
        if (line.trim() === '') {
          continue; // Skip empty lines that result from comment removal
        }
      } else {
        // Still inside multi-line comment, skip entire line
        continue;
      }
    }

    // Remove single-line multi-line comments /* ... */ on the same line
    while (line.includes('/*') && line.includes('*/')) {
      const startIndex = line.indexOf('/*');
      const endIndex = line.indexOf('*/');
      if (startIndex < endIndex) {
        line = line.substring(0, startIndex) + line.substring(endIndex + 2);
      } else {
        break; // Malformed comment, break to avoid infinite loop
      }
    }

    // Check for start of multi-line comment /* without closing */
    if (line.includes('/*') && !line.includes('*/')) {
      const startIndex = line.indexOf('/*');
      line = line.substring(0, startIndex);
      inMultiLineComment = true;
    }

    // Check if this is a single-line comment line
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      // Keep region/endregion comments
      if (isRegionLine(line)) {
        result.push(line);
      }
      // Remove all other single-line comments (skip this line)
      continue;
    }

    // Remove inline single-line comments // but preserve the code before them
    if (line.includes('//')) {
      const commentIndex = line.indexOf('//');
      // Check if the // is inside a string literal
      const beforeComment = line.substring(0, commentIndex);
      const singleQuotes = (beforeComment.match(/'/g) || []).length;
      const doubleQuotes = (beforeComment.match(/"/g) || []).length;
      const templateQuotes = (beforeComment.match(/`/g) || []).length;

      // If we're not inside a string (even number of quotes), remove the comment
      if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && templateQuotes % 2 === 0) {
        line = beforeComment.trimRight();
      }
    }

    // Add the processed line if it has content or is needed for spacing
    if (line.trim() !== '' || result.length > 0) {
      result.push(line);
    }
  }

  // Join the lines and clean up excessive blank lines
  let output = result.join('\n');

  // Collapse 3+ consecutive blank lines to 2
  output = output.replace(/\n{3,}/g, '\n\n');

  // Remove trailing whitespace and empty lines at the end
  output = output.replace(/\s+$/, '');

  return output;
}// Remove existing region markers so we don't duplicate them when we wrap new regions
function stripRegionLines(text: string): string {
  // Matches: //#region ...  or  //#endregion ...
  return text.replace(/^\s*\/\/\s*#(?:end)?region\b.*$/gmi, '').replace(/\n{3,}/g, '\n\n');
}

// Convenience to get a member's text sanitized of old region lines
function memberTextSansRegions(m: any): string {
  return stripRegionLines(m.getText());
}

/** Remove blank lines that are OUTSIDE of strings/template literals. Safe for inline templates. */
export function removeBlankLinesOutsideStrings(fileText: string): string {
  type R = { start: number; end: number };
  const ranges: R[] = [];

  // Collect string + template literal token ranges
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ false, ts.LanguageVariant.Standard, fileText);
  while (true) {
    const kind = scanner.scan();
    if (kind === ts.SyntaxKind.EndOfFileToken) break;
    if (
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      kind === ts.SyntaxKind.TemplateHead ||
      kind === ts.SyntaxKind.TemplateMiddle ||
      kind === ts.SyntaxKind.TemplateTail
    ) {
      ranges.push({ start: scanner.getTokenPos(), end: scanner.getTextPos() });
    }
  }
  // Merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: R[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else last.end = Math.max(last.end, r.end);
  }

  const intersects = (s: number, e: number) => {
    for (const r of merged) {
      if (e <= r.start) break;
      if (s < r.end && e > r.start) return true;
    }
    return false;
  };

  // Remove any line that is purely whitespace and not inside a protected range
  const lines = fileText.split('\n');
  let pos = 0;
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\r$/, ''); // handle CRLF
    const start = pos;
    const end = pos + raw.length; // excluding the '\n'
    const isBlank = /^\s*$/.test(line);
    const keep = !isBlank || intersects(start, end);
    if (keep) out.push(raw);
    pos = end + 1; // + '\n'
  }
  return out.join('\n');
}

function reorderMembers(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const sf = createSource(fileText, filePath);
  reorderAngularClasses(sf, withDefaults(opts));
  return sf.getFullText();
}

/* ========= Helpers ========= */

function withDefaults(opts?: OrganizeOptions): Required<OrganizeOptions> {
  return {
    emitRegions: opts?.emitRegions ?? true,
    optimizeMethodProximity: opts?.optimizeMethodProximity ?? false,
    removeUnusedImports: opts?.removeUnusedImports ?? true,
    removeUnusedVariables: opts?.removeUnusedVariables ?? true,
    ensureBlankLineAfterImports: opts?.ensureBlankLineAfterImports ?? true
  };
}

function createSource(fileText: string, filePath: string): SourceFile {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
  return project.createSourceFile(filePath, fileText, { overwrite: true });
}

/* ========= Safe import sorting (no trailing \n, no forgotten nodes) ========= */

/**
 * Remove unused imports and variables from the source file
 */
function removeUnusedImportsAndVariables(sf: SourceFile, opts: Required<OrganizeOptions>) {
  if (opts.removeUnusedImports) {
    removeUnusedImports(sf);
  }
  if (opts.removeUnusedVariables) {
    removeUnusedVariables(sf);
  }
}

/**
 * Remove unused import declarations
 */
function removeUnusedImports(sf: SourceFile) {
  const imports = sf.getImportDeclarations();
  const sourceText = sf.getFullText();

  for (const importDecl of imports) {
    const namedImports = importDecl.getNamedImports();
    const defaultImport = importDecl.getDefaultImport();
    const namespaceImport = importDecl.getNamespaceImport();

    // Check for unused named imports
    if (namedImports.length > 0) {
      const usedImports = namedImports.filter(namedImport => {
        const name = namedImport.getName();
        const alias = namedImport.getAliasNode()?.getText() || name;

        // Create regex to find usage of this import
        const usagePattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'g');

        // Count occurrences (should be more than 1 if used - 1 for the import itself)
        const matches = sourceText.match(usagePattern) || [];
        return matches.length > 1;
      });

      if (usedImports.length === 0 && !defaultImport && !namespaceImport) {
        // Remove entire import if no named imports are used and no default/namespace
        importDecl.remove();
        continue;
      } else if (usedImports.length < namedImports.length) {
        // Remove only unused named imports
        const unusedImports = namedImports.filter(namedImport => !usedImports.includes(namedImport));
        unusedImports.forEach(unusedImport => unusedImport.remove());
      }
    }

    // Check for unused default import
    if (defaultImport && !namespaceImport && namedImports.length === 0) {
      const defaultName = defaultImport.getText();
      const usagePattern = new RegExp(`\\b${escapeRegex(defaultName)}\\b`, 'g');
      const matches = sourceText.match(usagePattern) || [];

      if (matches.length <= 1) {
        importDecl.remove();
      }
    }

    // Check for unused namespace import
    if (namespaceImport && !defaultImport && namedImports.length === 0) {
      const namespaceName = namespaceImport.getText();
      const usagePattern = new RegExp(`\\b${escapeRegex(namespaceName)}\\b`, 'g');
      const matches = sourceText.match(usagePattern) || [];

      if (matches.length <= 1) {
        importDecl.remove();
      }
    }
  }
}

/**
 * Remove unused variables and methods (private only for safety)
 */
function removeUnusedVariables(sf: SourceFile) {
  const classes = sf.getClasses();

  for (const cls of classes) {
    const members = cls.getMembers();
    const classText = cls.getText();

    for (const member of members) {
      // Only process property declarations and methods
      if (!Node.isPropertyDeclaration(member) && !Node.isMethodDeclaration(member)) continue;

      // Only remove private members to be safe
      if (!member.hasModifier?.('private')) continue;

      const memberName = member.getName?.();
      if (!memberName) continue;

      // Skip constructors and lifecycle methods
      if (Node.isConstructorDeclaration(member)) continue;
      if (Node.isMethodDeclaration(member) && /^ng[A-Z]/.test(memberName)) continue;

      // Check if the member is used within the class
      const usagePattern = new RegExp(`\\b${escapeRegex(memberName)}\\b`, 'g');
      const matches = classText.match(usagePattern) || [];

      // If only one match (the declaration itself), it's unused
      if (matches.length <= 1) {
        member.remove();
      }
    }
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensure blank line after imports
 */
function ensureBlankLineAfterImports(sf: SourceFile) {
  const imports = sf.getImportDeclarations();
  if (imports.length === 0) return;

  const lastImport = imports[imports.length - 1];
  const nextNode = lastImport.getNextSibling();

  if (nextNode) {
    const importEnd = lastImport.getEnd();
    const nextStart = nextNode.getStart(true);
    const textBetween = sf.getFullText().slice(importEnd, nextStart);

    // Count newlines between import and next node
    const newlineCount = (textBetween.match(/\n/g) || []).length;

    if (newlineCount < 2) {
      // Insert additional newline to ensure blank line
      const additionalNewlines = '\n'.repeat(2 - newlineCount);
      sf.insertText(importEnd, additionalNewlines);
    }
  }
}

function sortImports(sf: SourceFile) {
  const imports = sf.getImportDeclarations();
  if (imports.length === 0) return;

  const items = imports.map(imp => ({
    text: imp.getText(),
    spec: imp.getModuleSpecifierValue()
  }));

  const groupOf = (spec: string): number => {
    if (spec.startsWith('.') || spec.startsWith('..')) return 2; // relative
    if (spec.startsWith('@app/') || spec.startsWith('@shared/') || spec.startsWith('@core/')) return 1; // aliases
    return 0; // external
  };

  items.sort((a, b) => {
    const ga = groupOf(a.spec), gb = groupOf(b.spec);
    if (ga !== gb) return ga - gb;
    return a.spec.localeCompare(b.spec);
  });

  const groups: string[][] = [[], [], []];
  for (const it of items) groups[groupOf(it.spec)].push(it.text);

  const parts: string[] = [];
  if (groups[0].length) parts.push(...groups[0]);
  if (groups[0].length && (groups[1].length || groups[2].length)) parts.push('');
  if (groups[1].length) parts.push(...groups[1]);
  if (groups[1].length && groups[2].length) parts.push('');
  if (groups[2].length) parts.push(...groups[2]);

  const start = imports[0].getStart(true);
  const end = imports[imports.length - 1].getEnd();
  const full = sf.getFullText();
  const newFull = full.slice(0, start) + parts.join('\n') + '\n' + full.slice(end); // Add extra \n for blank line
  sf.replaceWithText(newFull);
}

/* ========= Class member reordering (regions optional, lifecycle + hooks) ========= */

/**
 * Analyzes method calls and sorts methods by proximity of usage.
 * Methods that call each other are placed closer together.
 */
function sortMethodsByProximity(methods: any[], allMembers: any[]): any[] {
  if (methods.length <= 1) return methods;

  // Build a call graph: method name -> array of methods it calls
  const callGraph = new Map<string, Set<string>>();
  const methodNames = new Set(methods.map(m => m.getName?.() ?? ''));

  // Analyze each method to find which other methods it calls
  for (const method of methods) {
    const methodName = method.getName?.() ?? '';
    const calls = new Set<string>();

    // Get the method body text
    const methodText = method.getText() ?? '';

    // Find method calls using simple regex (this.methodName() or methodName())
    const callMatches = methodText.matchAll(/(?:this\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);

    for (const match of callMatches) {
      const calledMethod = match[1];
      if (methodNames.has(calledMethod) && calledMethod !== methodName) {
        calls.add(calledMethod);
      }
    }

    callGraph.set(methodName, calls);
  }

  // Build reverse call graph (which methods call this method)
  const reverseCallGraph = new Map<string, Set<string>>();
  for (const methodName of methodNames) {
    reverseCallGraph.set(methodName, new Set());
  }
  for (const [caller, callees] of callGraph) {
    for (const callee of callees) {
      reverseCallGraph.get(callee)?.add(caller);
    }
  }

  // Find method clusters using a more sophisticated approach
  const clusters: any[][] = [];
  const visited = new Set<string>();

  // Create clusters by following call chains
  for (const method of methods) {
    const methodName = method.getName?.() ?? '';
    if (visited.has(methodName)) continue;

    const cluster: any[] = [];
    const toVisit = [methodName];
    const clusterNames = new Set<string>();

    // Breadth-first traversal to find all related methods
    while (toVisit.length > 0) {
      const currentName = toVisit.shift()!;
      if (clusterNames.has(currentName)) continue;

      clusterNames.add(currentName);
      visited.add(currentName);

      const currentMethod = methods.find(m => m.getName?.() === currentName);
      if (currentMethod) {
        cluster.push(currentMethod);
      }

      // Add methods this one calls
      const calls = callGraph.get(currentName) ?? new Set();
      for (const callee of calls) {
        if (!visited.has(callee) && !clusterNames.has(callee)) {
          toVisit.push(callee);
        }
      }

      // Add methods that call this one
      const callers = reverseCallGraph.get(currentName) ?? new Set();
      for (const caller of callers) {
        if (!visited.has(caller) && !clusterNames.has(caller)) {
          toVisit.push(caller);
        }
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  // Sort clusters by size (larger clusters first) and then by alphabetical order of first method
  clusters.sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length; // Larger clusters first
    }
    const nameA = a[0]?.getName?.() ?? '';
    const nameB = b[0]?.getName?.() ?? '';
    return nameA.localeCompare(nameB);
  });

  // Within each cluster, sort methods to put callers before callees when possible
  for (const cluster of clusters) {
    cluster.sort((a, b) => {
      const nameA = a.getName?.() ?? '';
      const nameB = b.getName?.() ?? '';

      // If A calls B, A should come first
      if (callGraph.get(nameA)?.has(nameB)) return -1;
      if (callGraph.get(nameB)?.has(nameA)) return 1;

      // Otherwise sort alphabetically
      return nameA.localeCompare(nameB);
    });
  }

  // Flatten clusters into final sorted array
  const result: any[] = [];
  for (const cluster of clusters) {
    result.push(...cluster);
  }

  return result;
}

function reorderAngularClasses(sf: SourceFile, opts: Required<OrganizeOptions>) {
  // no SyntaxKind needed — this is simpler and stable
  const classes = sf.getClasses();
  for (const cls of classes) reorderOneClass(cls, opts);
}

function reorderOneClass(cls: ClassDeclaration, opts: Required<OrganizeOptions>) {
  const members = cls.getMembers();

  const isReadonlyStatic = (m: any) => m.isStatic?.() && (m.isReadonly?.() ?? false) && Node.isPropertyDeclaration(m);
  const isField = (m: any) => Node.isPropertyDeclaration(m) && !isReadonlyStatic(m);
  const isGetter = (m: any) => Node.isGetAccessorDeclaration(m);
  const isSetter = (m: any) => Node.isSetAccessorDeclaration(m);
  const isCtor = (m: any) => Node.isConstructorDeclaration(m);
  const isMethod = (m: any) => Node.isMethodDeclaration(m);

  const hasDecoratorNamedAny = (m: any, names: string[]) =>
    !!m.getDecorators?.().some((d: any) => names.includes(d.getName?.()));

  // Decorated kinds
  const isInputProp = (m: any) => isField(m) && hasDecoratorNamedAny(m, ['Input']);
  const isOutputProp = (m: any) => isField(m) && hasDecoratorNamedAny(m, ['Output']);
  const isViewQuery = (m: any) => isField(m) && hasDecoratorNamedAny(m, ['ViewChild', 'ViewChildren']);
  const isInputSetter = (m: any) => isSetter(m) && hasDecoratorNamedAny(m, ['Input']);

  // Signal-based API detection
  const isSignalBasedAPI = (m: any) => {
    if (!isField(m)) return false;
    const initText = m.getInitializer?.()?.getText?.() ?? '';
    return /\b(inject\s*\(|input\s*[<.(]|output\s*[<.(]|signal\s*[<.(])/.test(initText);
  };

  // Access level
  const accessOf = (m: any): 'public' | 'protected' | 'private' => {
    if (m.hasModifier?.('private')) return 'private';
    if (m.hasModifier?.('protected')) return 'protected';
    return 'public';
  };

  // Angular lifecycle detection + conventional order
  const ngOrder = [
    'ngOnChanges',
    'ngOnInit',
    'ngDoCheck',
    'ngAfterContentInit',
    'ngAfterContentChecked',
    'ngAfterViewInit',
    'ngAfterViewChecked',
    'ngOnDestroy'
  ];
  const isNgLifecycle = (m: any) => isMethod(m) && /^ng[A-Z]/.test(m.getName?.() ?? '');

  // Signal “hooks” as fields, e.g.: `_ = effect(...)` or `_x = computed(...)`
  const isSignalHookField = (m: any) => {
    if (!isField(m)) return false;
    const initText = m.getInitializer?.()?.getText?.() ?? '';
    return /\b(effect|computed)\s*\(/.test(initText);
  };

  /* Final order
     00 constants (static readonly)
     01 fields: private (plain)
     02 fields: protected (plain)
     03 fields: public (plain)
     04 Signal-based APIs (inject, input<>(), output<>(), signal<>())
     05 @Input properties
     06 @Input setters
     07 @Output properties
     08 @ViewChild/@ViewChildren
     09 getters: public
     10 getters: protected
     11 getters: private
     12 setters (non-@Input): public
     13 setters (non-@Input): protected
     14 setters (non-@Input): private
     15 constructor
     16 Angular lifecycle methods (except ngOnDestroy)
     17 Signal hooks (effect/computed)        <-- NEW (after ctor, with lifecycle block preceding it)
     18 methods: public (non-ng)
     19 methods: protected (non-ng)
     20 methods: private (non-ng)
     21 ngOnDestroy (always last)
  */
  const B: any[][] = Array.from({ length: 22 }, () => []);
  const LABELS: string[] = [
    'Constants',
    'Fields · private',
    'Fields · protected',
    'Fields · public',
    'Signal APIs (inject/input/output/signal)',
    '@Input properties',
    '@Input setters',
    '@Output properties',
    '@View queries',
    'Getters · public',
    'Getters · protected',
    'Getters · private',
    'Setters (non-@Input) · public',
    'Setters (non-@Input) · protected',
    'Setters (non-@Input) · private',
    'Constructor',
    'Angular lifecycle',
    'Signal hooks (effect/computed)',
    'Methods · public',
    'Methods · protected',
    'Methods · private',
    'ngOnDestroy'
  ];

  for (const m of members) {
    if (isReadonlyStatic(m)) { B[0].push(m); continue; }
    if (isSignalBasedAPI(m)) { B[4].push(m); continue; }
    if (isInputProp(m)) { B[5].push(m); continue; }
    if (isInputSetter(m)) { B[6].push(m); continue; }
    if (isOutputProp(m)) { B[7].push(m); continue; }
    if (isViewQuery(m)) { B[8].push(m); continue; }

    if (isGetter(m)) {
      const a = accessOf(m);
      if (a === 'public') B[9].push(m);
      else if (a === 'protected') B[10].push(m);
      else B[11].push(m);
      continue;
    }

    if (isSetter(m)) {
      const a = accessOf(m);
      if (a === 'public') B[12].push(m);
      else if (a === 'protected') B[13].push(m);
      else B[14].push(m);
      continue;
    }

    if (isCtor(m)) { B[15].push(m); continue; }
    if (isMethod(m) && isNgLifecycle(m)) {
      const methodName = m.getName?.() ?? '';
      if (methodName === 'ngOnDestroy') {
        B[21].push(m); // ngOnDestroy goes to the special last bucket
      } else {
        B[16].push(m); // Other lifecycle methods go to the regular lifecycle bucket
      }
      continue;
    }
    if (isSignalHookField(m)) { B[17].push(m); continue; }

    if (isMethod(m)) {
      const a = accessOf(m);
      if (a === 'public') B[18].push(m);
      else if (a === 'protected') B[19].push(m);
      else B[20].push(m);
      continue;
    }

    if (isField(m)) {
      const a = accessOf(m);
      if (a === 'private') B[1].push(m);
      else if (a === 'protected') B[2].push(m);
      else B[3].push(m);
      continue;
    }
  }

  // Sort inside buckets
  const alphaByName = (a: any, b: any) => (a.getName?.() ?? '').localeCompare(b.getName?.() ?? '');

  for (let i = 0; i < B.length; i++) {
    if (i === 4) {
      // Signal-based APIs - sort by type priority: inject, input, output, signal
      B[i].sort((a: any, b: any) => {
        const aInit = a.getInitializer?.()?.getText?.() ?? '';
        const bInit = b.getInitializer?.()?.getText?.() ?? '';
        const aPriority = /\binject\s*\(/.test(aInit) ? 0 :
          /\binput\s*[<.(]/.test(aInit) ? 1 :
            /\boutput\s*[<.(]/.test(aInit) ? 2 :
              /\bsignal\s*[<.(]/.test(aInit) ? 3 : 4;
        const bPriority = /\binject\s*\(/.test(bInit) ? 0 :
          /\binput\s*[<.(]/.test(bInit) ? 1 :
            /\boutput\s*[<.(]/.test(bInit) ? 2 :
              /\bsignal\s*[<.(]/.test(bInit) ? 3 : 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.getName?.() ?? '').localeCompare(b.getName?.() ?? '');
      });
    } else if (i === 16) {
      // Angular lifecycle methods - keep specific order (excluding ngOnDestroy)
      B[i].sort((a: any, b: any) => {
        const an = a.getName?.() ?? '';
        const bn = b.getName?.() ?? '';
        const ai = ngOrder.indexOf(an);
        const bi = ngOrder.indexOf(bn);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return an.localeCompare(bn);
      });
    } else if (i === 21) {
      // ngOnDestroy bucket - should only have one method, but sort just in case
      B[i].sort(alphaByName);
    } else if (opts.optimizeMethodProximity && (i >= 18 && i <= 20)) {
      // For method buckets (public, protected, private), sort by usage proximity
      B[i] = sortMethodsByProximity(B[i], members);
    } else {
      B[i].sort(alphaByName);
    }
  }

  // Build class body: regions optional, keep one blank line between consecutive methods
  const body = cls.getChildSyntaxList();
  if (!body) return;

  const src = cls.getSourceFile().getFullText();
  const start = body.getPos(); // after '{'
  const end = body.getEnd(); // before '}'
  const before = src.slice(0, start);
  const after = stripRegionLines(src.slice(end))


  const isMethodNode = (n: any) => Node.isMethodDeclaration(n) || Node.isConstructorDeclaration(n);
  const bucketIsMethody = (idx: number) => idx === 15 || idx === 16 || idx === 17 || (idx >= 18 && idx <= 21);

  const memberTextSansRegions = (m: any) => stripRegionLines(m.getText());

  const joinMembers = (arr: any[], ensureBlankBetweenMethods: boolean, bucketIndex?: number) => {
    // Special handling for Signal APIs bucket (index 4) regardless of ensureBlankBetweenMethods
    if (bucketIndex === 4) {
      // Group members by API type
      const apiGroups: { [key: string]: any[] } = {
        inject: [],
        input: [],
        output: [],
        signal: []
      };

      for (const member of arr) {
        const initText = member.getInitializer?.()?.getText?.() ?? '';

        if (/\binject\s*\(/.test(initText)) {
          apiGroups.inject.push(member);
        } else if (/\binput\s*[<.(]/.test(initText) || /\binput\.required\s*[<(]/.test(initText)) {
          apiGroups.input.push(member);
        } else if (/\boutput\s*[<.(]/.test(initText)) {
          apiGroups.output.push(member);
        } else if (/\bsignal\s*[<.(]/.test(initText)) {
          apiGroups.signal.push(member);
        }
      }

      // Sort each group alphabetically and create sections
      const parts: string[] = [];
      const groupOrder = ['inject', 'input', 'output', 'signal'];

      for (let i = 0; i < groupOrder.length; i++) {
        const groupName = groupOrder[i];
        const group = apiGroups[groupName];

        if (group.length > 0) {
          // Add blank line before group (except for first group)
          if (parts.length > 0) {
            parts.push('');
          }

          // Sort group alphabetically and add members
          const sortedGroup = group.sort((a, b) => {
            const nameA = a.getName?.() ?? a.getText();
            const nameB = b.getName?.() ?? b.getText();
            return nameA.localeCompare(nameB);
          });

          for (const member of sortedGroup) {
            parts.push(memberTextSansRegions(member));
          }
        }
      }

      return parts.join('\n');
    }

    if (!ensureBlankBetweenMethods) return arr.map(memberTextSansRegions).join('\n');    // Default behavior for other buckets
    const parts: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      parts.push(memberTextSansRegions(arr[i]));
      const here = isMethodNode(arr[i]);
      const next = i + 1 < arr.length && isMethodNode(arr[i + 1]);
      if (here && next) parts.push('');
    }
    return parts.join('\n');
  }; const pieces: string[] = [];
  for (let i = 0; i < B.length; i++) {
    const arr = B[i];
    if (!arr.length) continue;

    const content = joinMembers(arr, bucketIsMethody(i), i);

    if (opts.emitRegions) {
      pieces.push(`//#region ${LABELS[i]}`);
      pieces.push(content);
      pieces.push(`//#endregion ${LABELS[i]}`);
      pieces.push(''); // blank line between regions
    } else {
      pieces.push(content);
      pieces.push(''); // still keep a blank line between groups
    }
  }
  while (pieces.length && pieces[pieces.length - 1] === '') pieces.pop();

  cls.getSourceFile().replaceWithText(before + '\n' + pieces.join('\n') + after);
}

/* ========= Angular Template Control Flow Conversion ========= */

/**
 * Convert *ngFor directives to @for control flow
 * Examples:
 * *ngFor="let item of items" -> @for (item of items; track item) { }
 * *ngFor="let item of items; let i = index" -> @for (item of items; track item; let i = $index) { }
 * *ngFor="let item of items; trackBy: trackByFn" -> @for (item of items; track trackByFn(item)) { }
 */
function convertNgForToAtFor(templateContent: string): string {
  // Pattern to match *ngFor with various syntax options
  const ngForPattern = /\*ngFor\s*=\s*["']([^"']+)["']/g;

  return templateContent.replace(ngForPattern, (match, forExpression: string) => {
    // Parse the for expression
    const parts = forExpression.split(';').map(p => p.trim());
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
    forResult += ')';

    return forResult;
  });
}

/**
 * Convert *ngIf directives to @if control flow
 * Examples:
 * *ngIf="condition" -> @if (condition) { }
 * *ngIf="condition; else elseTemplate" -> @if (condition) { } @else { }
 * *ngIf="condition as alias" -> @if (condition; as alias) { }
 */
function convertNgIfToAtIf(templateContent: string): string {
  // Pattern to match *ngIf with various syntax options
  const ngIfPattern = /\*ngIf\s*=\s*["']([^"']+)["']/g;

  return templateContent.replace(ngIfPattern, (match, ifExpression: string) => {
    // Handle "else" clause
    if (ifExpression.includes(';') && ifExpression.includes('else')) {
      const parts = ifExpression.split(';').map(p => p.trim());
      const condition = parts[0];

      // Check for "as alias" pattern
      const asMatch = condition.match(/(.+)\s+as\s+(\w+)/);
      if (asMatch) {
        const [, actualCondition, alias] = asMatch;
        return `@if (${actualCondition}; as ${alias})`;
      }

      return `@if (${condition})`;
    }

    // Handle "as alias" pattern without else
    const asMatch = ifExpression.match(/(.+)\s+as\s+(\w+)/);
    if (asMatch) {
      const [, condition, alias] = asMatch;
      return `@if (${condition}; as ${alias})`;
    }

    // Simple condition
    return `@if (${ifExpression})`;
  });
}

/**
 * Convert *ngSwitch directives to @switch control flow
 * Examples:
 * [ngSwitch]="value" -> @switch (value) { }
 * *ngSwitchCase="'case1'" -> @case ('case1') { }
 * *ngSwitchDefault -> @default { }
 */
function convertNgSwitchToAtSwitch(templateContent: string): string {
  // Convert [ngSwitch]
  templateContent = templateContent.replace(
    /\[ngSwitch\]\s*=\s*["']([^"']+)["']/g,
    '@switch ($1)'
  );

  // Convert *ngSwitchCase - handle both simple values and quoted strings
  templateContent = templateContent.replace(
    /\*ngSwitchCase\s*=\s*"([^"]*)"/g,
    '@case ($1)'
  );
  templateContent = templateContent.replace(
    /\*ngSwitchCase\s*=\s*'([^']*)'/g,
    '@case ($1)'
  );

  // Convert *ngSwitchDefault
  templateContent = templateContent.replace(
    /\*ngSwitchDefault/g,
    '@default'
  );

  return templateContent;
}

/**
 * Main function to convert all Angular structural directives to control flow syntax
 */
function convertAngularControlFlow(templateContent: string): string {
  let result = templateContent;
  result = convertNgForToAtFor(result);
  result = convertNgIfToAtIf(result);
  result = convertNgSwitchToAtSwitch(result);
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
 * Convert Angular structural directive at a specific position
 * This function is designed to work with cursor position or selection
 */
export function convertStructuralDirectiveAtPosition(
  fileText: string,
  filePath: string,
  startLine: number,
  endLine: number,
  startChar: number,
  endChar: number
): string {
  const lines = fileText.split('\n');

  // For HTML files, work directly on the lines
  if (filePath.endsWith('.html')) {
    return convertLinesWithStructuralDirectives(lines, startLine, endLine, startChar, endChar);
  }

  // For TypeScript files, we need to check if we're inside a template
  if (filePath.endsWith('.ts')) {
    // Find if the cursor position is within a template
    const templateInfo = findTemplateAtPosition(fileText, startLine, startChar);
    if (templateInfo) {
      return convertInlineTemplateAtPosition(fileText, templateInfo, startLine, endLine, startChar, endChar);
    }
  }

  return fileText;
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
  let currentPos = 0;
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
