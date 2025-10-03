import { Project, SourceFile, ClassDeclaration, Node } from 'ts-morph';
import * as ts from 'typescript';



export type OrganizeOptions = {
  emitRegions?: boolean; // default true
};

/* ========= Public API (each command calls one of these) ========= */

// Imports only
export function sortImportsOnly(fileText: string, filePath: string): string {
  const sf = createSource(fileText, filePath);
  sortImports(sf);
  return sf.getFullText();
}

// Members only (all buckets)
export function reorderAllMembers(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const sf = createSource(fileText, filePath);
  reorderAngularClasses(sf, withDefaults(opts));
  return sf.getFullText();
}

// Imports + members
export function organizeAllText(fileText: string, filePath: string, opts?: OrganizeOptions): string {
  const sf = createSource(fileText, filePath);
  sortImports(sf);
  reorderAngularClasses(sf, withDefaults(opts));
  return sf.getFullText();
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
  const removals: Array<{ start: number; end: number }> = [];

  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, fileText);

  const isRegionLine = (txt: string) => {
    const trimmed = txt.replace(/^\s*\/\//, '').trim();
    return /^#(?:end)?region\b/i.test(trimmed);
  };

  while (true) {
    const kind = scanner.scan();
    if (kind === ts.SyntaxKind.EndOfFileToken) break;

    const start = scanner.getTokenPos();
    const end = scanner.getTextPos();

    if (kind === ts.SyntaxKind.ShebangTrivia) continue;

    if (kind === ts.SyntaxKind.SingleLineCommentTrivia) {
      const txt = fileText.slice(start, end);
      if (!isRegionLine(txt)) removals.push({ start, end });
      continue;
    }

    if (kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      // Remove both /*...*/ and /** ... */ (JSDoc)
      removals.push({ start, end });
      continue;
    }
  }

  if (!removals.length) return fileText;

  removals.sort((a, b) => a.start - b.start);
  const merged: typeof removals = [];
  for (const r of removals) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else last.end = Math.max(last.end, r.end);
  }

  let out = '';
  let cursor = 0;
  for (const r of merged) {
    out += fileText.slice(cursor, r.start);
    cursor = r.end;
  }
  out += fileText.slice(cursor);

  // Optional: collapse 3+ blank lines to 2 after comment removal
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
}

// Remove existing region markers so we don't duplicate them when we wrap new regions
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
  return { emitRegions: opts?.emitRegions ?? true };
}

function createSource(fileText: string, filePath: string): SourceFile {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
  return project.createSourceFile(filePath, fileText, { overwrite: true });
}

/* ========= Safe import sorting (no trailing \n, no forgotten nodes) ========= */
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
  const newFull = full.slice(0, start) + parts.join('\n') + full.slice(end); // NOTE: no extra '\n'
  sf.replaceWithText(newFull);
}

/* ========= Class member reordering (regions optional, lifecycle + hooks) ========= */
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
     04 @Input properties
     05 @Input setters
     06 @Output properties
     07 @ViewChild/@ViewChildren
     08 getters: public
     09 getters: protected
     10 getters: private
     11 setters (non-@Input): public
     12 setters (non-@Input): protected
     13 setters (non-@Input): private
     14 constructor
     15 Angular lifecycle methods
     16 Signal hooks (effect/computed)        <-- NEW (after ctor, with lifecycle block preceding it)
     17 methods: public (non-ng)
     18 methods: protected (non-ng)
     19 methods: private (non-ng)
  */
  const B: any[][] = Array.from({ length: 20 }, () => []);
  const LABELS: string[] = [
    'Constants',
    'Fields · private',
    'Fields · protected',
    'Fields · public',
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
    'Methods · private'
  ];

  for (const m of members) {
    if (isReadonlyStatic(m)) { B[0].push(m); continue; }
    if (isInputProp(m)) { B[4].push(m); continue; }
    if (isInputSetter(m)) { B[5].push(m); continue; }
    if (isOutputProp(m)) { B[6].push(m); continue; }
    if (isViewQuery(m)) { B[7].push(m); continue; }

    if (isGetter(m)) {
      const a = accessOf(m);
      if (a === 'public') B[8].push(m);
      else if (a === 'protected') B[9].push(m);
      else B[10].push(m);
      continue;
    }

    if (isSetter(m)) {
      const a = accessOf(m);
      if (a === 'public') B[11].push(m);
      else if (a === 'protected') B[12].push(m);
      else B[13].push(m);
      continue;
    }

    if (isCtor(m)) { B[14].push(m); continue; }
    if (isMethod(m) && isNgLifecycle(m)) { B[15].push(m); continue; }
    if (isSignalHookField(m)) { B[16].push(m); continue; }

    if (isMethod(m)) {
      const a = accessOf(m);
      if (a === 'public') B[17].push(m);
      else if (a === 'protected') B[18].push(m);
      else B[19].push(m);
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
    if (i === 15) {
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
  const bucketIsMethody = (idx: number) => idx === 15 || idx === 16 || idx >= 17;

  const memberTextSansRegions = (m: any) => stripRegionLines(m.getText());

  const joinMembers = (arr: any[], ensureBlankBetweenMethods: boolean) => {
    if (!ensureBlankBetweenMethods) return arr.map(memberTextSansRegions).join('\n');
    const parts: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      parts.push(memberTextSansRegions(arr[i]));
      const here = isMethodNode(arr[i]);
      const next = i + 1 < arr.length && isMethodNode(arr[i + 1]);
      if (here && next) parts.push('');
    }
    return parts.join('\n');
  };

  const pieces: string[] = [];
  for (let i = 0; i < B.length; i++) {
    const arr = B[i];
    if (!arr.length) continue;

    const content = joinMembers(arr, bucketIsMethody(i));

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
