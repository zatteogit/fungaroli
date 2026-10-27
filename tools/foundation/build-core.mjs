import { execFileSync } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'dist/core');
await rm(output, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(root, 'tsconfig.core.json')], { cwd: root, stdio: 'inherit' });
await writeFile(path.join(output, 'package.json'), JSON.stringify({
  name: '@fronda/core',
  private: true,
  type: 'module',
  exports: { '.': { types: './index.d.ts', import: './index.js' } },
  sideEffects: false,
}, null, 2) + '\n');
console.log('Nucleo esportato in dist/core con tipi e manifesto ESM.');
