// Ambiente locale: npm run dev  |  npm run dev:edition -- <id>
// Lo stato di D1 e KV sta fuori dal repository: dentro, Wrangler lo vedrebbe come file
// statici modificati e ricaricherebbe il server all'infinito.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ids = readdirSync(new URL('../editions/', import.meta.url)).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(new URL(`../editions/${f}`, import.meta.url), 'utf8')).id);
const edition = process.argv[2] || 'fronda';
if (!ids.includes(edition)) { console.error(`Edizione sconosciuta. Disponibili: ${ids.join(', ')}`); process.exit(1); }
const port = process.env.PORT || '8787';
const persist = process.env.FRONDA_DEV_STATE || join(homedir(), '.fronda-dev', edition);
const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' }).status ?? 1;

if (run('npm', ['run', 'build:typescript'])) process.exit(1);
console.log(`Fronda locale · edizione ${edition} · http://localhost:${port} · dati in ${persist}`);
process.exit(run('npx', ['wrangler', 'dev', '--local', '--ip', '127.0.0.1', '--port', port,
  '--var', `APP_ORIGIN:http://localhost:${port}`, '--var', 'ENVIRONMENT:local', '--var', `EDITION:${edition}`,
  '--persist-to', persist]));
