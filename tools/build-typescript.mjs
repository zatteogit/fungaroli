// Native ES modules retain their public URLs. Generated JS is committed so that
// a plain static server and a clean git archive remain immediately runnable.
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = await mkdtemp(path.join(tmpdir(), 'fronda-ts-'));
const check = process.argv.includes('--check');
try {
  // Compile the domain without browser, Node or provider globals, even when
  // the enclosing application compiler has DOM types available.
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
    '--project', path.join(root, 'tsconfig.core.json'), '--noEmit'], { cwd: root, stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
    '--project', path.join(root, 'tsconfig.json'), '--outDir', output], { cwd: root, stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
    '--project', path.join(root, 'tsconfig.contracts.json')], { cwd: root, stdio: 'inherit' });
  let stale = false;
  async function files(directory, prefix = '') {
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) result.push(...await files(path.join(directory, entry.name), relative));
      else result.push(relative);
    }
    return result.sort();
  }
  for (const name of await files(output)) {
    if (!name.endsWith('.js')) throw Error(`Unexpected compiler output: ${name}`);
    const target = path.join(root, 'js', name);
    const content = `// Generated from src/js/${name.replace(/\.js$/, '.ts')}. Run npm run build:typescript; do not edit.\n`
      + await readFile(path.join(output, name), 'utf8');
    if (check) {
      const existing = await readFile(target, 'utf8').catch(() => null);
      if (existing !== content) { console.error(`JavaScript da rigenerare: js/${name}`); stale = true; }
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }
  if (stale) { console.error('Esegui npm run build:typescript e includi il risultato nel commit.'); process.exitCode = 1; }
  else console.log(check ? 'TypeScript e JavaScript pubblicati coerenti.' : 'Moduli TypeScript compilati in js/.');
} finally { await rm(output, { recursive: true, force: true }); }
