// Scanner API matches the exact TypeScript version pinned by the repository.
import * as ts from 'typescript/unstable/ast';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function inspectCoreSource(source, file, coreRoot) {
  const errors = [];
  const report = message => errors.push(`${file}: ${message}`);
  if (/@ts-(?:ignore|nocheck)/.test(source)) report('controllo dei tipi disattivato');
  const scanner = ts.createScanner(true, ts.LanguageVariant.Standard, source);
  const tokens = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFile; kind = scanner.scan()) {
    tokens.push({ kind, text: scanner.getTokenText(), value: scanner.getTokenValue() });
  }
  function dependency(token) {
    if (!token || token.kind !== ts.SyntaxKind.StringLiteral) { report('import dinamico non verificabile'); return; }
    const specifier = token.value;
    const target = path.resolve(path.dirname(file), specifier);
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) report(`dipendenza esterna: ${specifier}`);
    else if (!target.startsWith(path.resolve(coreRoot) + path.sep)) report(`dipendenza fuori dal nucleo: ${specifier}`);
    if (!specifier.endsWith('.js')) report(`usare estensione .js: ${specifier}`);
  }
  for (const [index, token] of tokens.entries()) {
    const next = tokens[index + 1];
    if (token.kind === ts.SyntaxKind.FromKeyword && next?.kind === ts.SyntaxKind.StringLiteral) dependency(next);
    if (token.kind === ts.SyntaxKind.ImportKeyword) {
      if (next?.kind === ts.SyntaxKind.OpenParenToken) {
        dependency(tokens[index + 2]);
        if (tokens[index + 3]?.kind !== ts.SyntaxKind.CloseParenToken) report('import composto non verificabile');
      }
      else if (next?.kind === ts.SyntaxKind.StringLiteral) dependency(next);
    }
    if (token.kind === ts.SyntaxKind.AnyKeyword) report('any non ammesso');
    if (['require', 'eval', 'Function'].includes(token.text) && next?.kind === ts.SyntaxKind.OpenParenToken) report('esecuzione dinamica non ammessa');
  }
  return errors;
}

export async function checkArchitecture(root) {
  const coreRoot = path.join(root, 'src/js/core');
  const errors = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith('.ts')) errors.push(...inspectCoreSource(await readFile(file, 'utf8'), file, coreRoot));
    }
  }
  await walk(coreRoot);
  return errors;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = await checkArchitecture(fileURLToPath(new URL('../../', import.meta.url)));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Nucleo portatile: dipendenze e tipi espliciti verificati.');
}
