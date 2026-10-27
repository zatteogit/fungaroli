// Native ES modules retain their public URLs. Generated JS is committed so that
// a plain static server and a clean git archive remain immediately runnable.
import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = await mkdtemp(path.join(tmpdir(), 'fronda-ts-'));
const check = process.argv.includes('--check');
try {
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
    '--project', path.join(root, 'tsconfig.json'), '--outDir', output], { cwd: root, stdio: 'inherit' });
  let stale = false;
  for (const name of (await readdir(output)).sort()) {
    if (!name.endsWith('.js')) throw Error(`Unexpected compiler output: ${name}`);
    const target = path.join(root, 'js', name);
    const content = `// Generated from src/field/${name.replace(/\.js$/, '.ts')}. Run npm run build:typescript; do not edit.\n`
      + await readFile(path.join(output, name), 'utf8');
    if (check) {
      const existing = await readFile(target, 'utf8').catch(() => null);
      if (existing !== content) { console.error(`JavaScript da rigenerare: js/${name}`); stale = true; }
    } else await writeFile(target, content);
  }
  if (stale) { console.error('Esegui npm run build:typescript e includi il risultato nel commit.'); process.exitCode = 1; }
  else console.log(check ? 'TypeScript e JavaScript pubblicati coerenti.' : 'Moduli TypeScript compilati in js/.');
} finally { await rm(output, { recursive: true, force: true }); }
