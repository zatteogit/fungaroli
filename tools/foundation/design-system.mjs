import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { declarations, extractBlock, resolveValue, refsIn } from '../ds-guard.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export function foundationCss(data) {
  if (data.schemaVersion !== 1) throw Error('Versione token sconosciuta.');
  const usage = new Set();
  const lines = ['/* Generated from design-system/foundation.json. Run npm run design:build. */', ':root {'];
  const reference = (value, tier, prefix) => {
    const match = /^\{([a-z]+)\.([a-z0-9-]+)\}$/.exec(value);
    if (!match || match[1] !== tier || !Object.hasOwn(data[tier], match[2])) throw Error(`Riferimento di livello non valido: ${value}`);
    usage.add(`${tier}.${match[2]}`);
    return `var(--${prefix}${match[2]})`;
  };
  for (const [id, token] of Object.entries(data.primitive)) {
    if (!/^[a-z][a-z0-9-]*$/.test(id) || !Number.isFinite(token.value) || token.value < 0 ||
        !['dimension', 'number', 'duration'].includes(token.type) ||
        (token.type === 'dimension' && token.unit !== 'px') || (token.type === 'duration' && token.unit !== 'ms') ||
        (token.type === 'number' && token.unit !== undefined)) throw Error(`Primitiva non valida: ${id}`);
    lines.push(`  --_ds-${id}: ${token.value}${token.unit || ''};`);
  }
  for (const [id, value] of Object.entries(data.semantic)) lines.push(`  --ds-${id}: ${reference(value, 'primitive', '_ds-')};`);
  for (const [id, value] of Object.entries(data.component)) lines.push(`  --ds-component-${id}: ${reference(value, 'semantic', 'ds-')};`);
  for (const id of Object.keys(data.primitive)) if (!usage.has(`primitive.${id}`)) throw Error(`Primitiva orfana: ${id}`);
  lines.push('}', '');
  return lines.join('\n');
}
export function inspectNewConsumer(source, knownTokens) {
  const errors = [];
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/--_(?:ref|ds)-/.test(css)) errors.push('primitiva privata nel consumer');
  if (/#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(|\b\d+(?:\.\d+)?(?:px|rem|em|ms)\b/i.test(css)) errors.push('valore visivo fuori dai token');
  for (const match of css.matchAll(/(?:^|[;{])\s*(?:color|background(?:-color)?|border-color|outline-color|fill|stroke)\s*:\s*([^;}]+)/g)) {
    const value = match[1].replace(/var\(--[a-z0-9-]+\)/gi, '').trim();
    if (value && !['transparent', 'currentColor', 'inherit', 'none'].includes(value)) errors.push('colore fuori dai ruoli semantici');
  }
  for (const token of refsIn(css)) if (!knownTokens.has(token)) errors.push(`token non esposto: ${token}`);
  return errors;
}
export async function buildDesignSystem({ check = false, root = ROOT } = {}) {
  const readJson = async name => JSON.parse(await readFile(path.join(root, 'design-system', name), 'utf8'));
  const foundation = await readJson('foundation.json');
  const css = foundationCss(foundation);
  const source = await readFile(path.join(root, 'css/tokens.css'), 'utf8');
  const light = declarations(extractBlock(source, ':root').text);
  const dark = new Map([...light, ...declarations(extractBlock(source, ':root[data-theme="dark"]').text)]);
  const modes = {};
  for (const [mode, values] of [['light', light], ['dark', dark]]) {
    modes[mode] = Object.fromEntries([...light.keys()].filter(id => !id.startsWith('--_')).map(id => {
      const value = resolveValue(id, values);
      return [id, { value, requiresPlatformAdapter: !/^#[\da-f]{3,8}$/i.test(value) }];
    }));
  }
  const profiles = await readJson('editions.json');
  if (Object.keys(profiles.profiles).sort().join() !== 'academy,free,partners,plus,territory') throw Error('Profili di prodotto incompleti.');
  const locked = ['risk-semantics', 'privacy-consent', 'scientific-uncertainty', 'essential-safety', 'accessibility', 'source-attribution', 'shared-components'];
  if (locked.some(id => !profiles.locked?.includes(id))) throw Error('Protezione comune mancante.');
  for (const profile of Object.values(profiles.profiles)) {
    if (Object.keys(profile).some(key => !['label', 'accent', 'task'].includes(key))) throw Error('Override di offerta non consentito.');
    if (!profile.accent.startsWith('--story-') || !light.has(profile.accent)) throw Error('Accento editoriale non valido.');
  }
  const known = new Set([...light.keys(), ...declarations(extractBlock(css, ':root').text).keys()]);
  const findings = inspectNewConsumer(await readFile(path.join(root, 'infra/demo/style.css'), 'utf8'), known);
  if (findings.length) throw Error(findings.join('\n'));
  const experience = await readJson('experience.json');
  const language = await readJson('language.it.json');
  if (experience.navigation.join() !== 'Uscite,Mappa,Scopri,Taccuino' || language.locale !== 'it-IT') throw Error('Contratto esperienza/lingua non valido.');
  const output = {
    'css/foundation-tokens.css': css,
    'design-system/tokens.resolved.json': JSON.stringify({ schemaVersion: 1, source: 'css/tokens.css', modes }, null, 2) + '\n',
  };
  for (const [file, content] of Object.entries(output)) {
    if (check) {
      if (await readFile(path.join(root, file), 'utf8').catch(() => null) !== content) throw Error(`Output da rigenerare: ${file}`);
    } else await writeFile(path.join(root, file), content);
  }
  return { modes: 2, publicTokens: Object.keys(modes.light).length, newConsumerFiles: 1 };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log(await buildDesignSystem({ check: process.argv.includes('--check') })); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
