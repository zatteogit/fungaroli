import { readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'jsonc-parser';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const NAMES = ['local', 'test', 'staging', 'demo'];
export function validateEnvironments(manifest, production) {
  if (manifest?.schemaVersion !== 1 || !manifest.environments ||
      Object.keys(manifest.environments).sort().join() !== [...NAMES].sort().join()) throw Error('Matrice ambienti non valida.');
  const workers = new Set([production.name]);
  const ports = new Set();
  for (const name of NAMES) {
    const entry = manifest.environments[name];
    if (entry.worker !== `fronda-${name}` || workers.has(entry.worker) || ports.has(entry.port) ||
        !Number.isInteger(entry.port) || entry.port < 1024 || entry.port > 65535 ||
        entry.data !== 'synthetic' || entry.remote !== false) throw Error(`Ambiente non isolato: ${name}`);
    workers.add(entry.worker); ports.add(entry.port);
  }
}

/** Build independent configs from an allowlist; production resources are never inherited. */
export function environmentConfig(name, manifest, production, root = ROOT) {
  validateEnvironments(manifest, production);
  if (!NAMES.includes(name)) throw Error('Scegli local, test, staging o demo. Produzione usa wrangler.jsonc.');
  const entry = manifest.environments[name];
  const demo = name === 'demo';
  return {
    $schema: path.join(root, 'node_modules/wrangler/config-schema.json'),
    name: entry.worker,
    main: path.join(root, demo ? 'infra/demo/worker.js' : 'infra/nonproduction-worker.js'),
    compatibility_date: production.compatibility_date,
    compatibility_flags: [...production.compatibility_flags],
    dev: { ip: '127.0.0.1', port: entry.port, inspector_port: 0 },
    // Even accidental manual deployment has no public workers.dev or preview route.
    workers_dev: false,
    preview_urls: false,
    vars: {
      APP_ORIGIN: `http://localhost:${entry.port}`,
      FRONDA_ENVIRONMENT: name,
      ...(demo ? {} : { CMS_ADMIN_IDS: name === 'test' ? 'cms-test-admin' : '', CMS_EDITOR_IDS: name === 'test' ? 'cms-test-editor' : '' }),
    },
    assets: {
      directory: path.join(root, demo ? '.fronda/demo-assets' : '.'),
      binding: 'ASSETS',
      run_worker_first: demo ? true : ['/api/*', '/redazione', '/redazione/'],
    },
    ...(demo ? {} : {
      rules: [{ type: 'Text', globs: ['**/*.sql'], fallthrough: true }],
      d1_databases: ['COMMUNITY_DB', 'CMS_DB'].map((binding, index) => ({
        binding,
        database_name: `${entry.worker}-${index === 0 ? 'community' : 'content'}`,
        // Explicit local placeholders avoid Wrangler provisioning on a mistaken deploy.
        database_id: `00000000-0000-4000-8000-${String(NAMES.indexOf(name) * 2 + index + 1).padStart(12, '0')}`,
        migrations_dir: path.join(root, 'migrations'),
        remote: false,
      })),
      kv_namespaces: [{ binding: 'DIARIO', id: '0'.repeat(31) + String(NAMES.indexOf(name) + 1), remote: false }],
    }),
    // Cron, mail, push, routes and production role IDs are absent by construction.
    triggers: { crons: [] },
  };
}
export async function readInputs(root = ROOT) {
  const manifest = JSON.parse(await readFile(path.join(root, 'infra/environments.json'), 'utf8'));
  const errors = [];
  const production = parse(await readFile(path.join(root, 'wrangler.jsonc'), 'utf8'), errors, { allowTrailingComma: true });
  if (errors.length) throw Error('Configurazione produzione non leggibile.');
  return { manifest, production };
}
export async function prepareEnvironment(name, root = ROOT, { port } = {}) {
  const { manifest, production } = await readInputs(root);
  if (port !== undefined) {
    if (!Object.hasOwn(manifest.environments, name)) throw Error('Ambiente sconosciuto.');
    manifest.environments[name].port = port;
  }
  const config = environmentConfig(name, manifest, production, root);
  const directory = path.join(root, '.fronda/config', name);
  await mkdir(directory, { recursive: true });
  if (name === 'demo') {
    const assets = path.join(root, '.fronda/demo-assets');
    await mkdir(assets, { recursive: true });
    for (const file of ['index.html', 'app.js', 'style.css']) await cp(path.join(root, 'infra/demo', file), path.join(assets, file));
    await cp(path.join(root, 'css/tokens.css'), path.join(assets, 'tokens.css'));
    await cp(path.join(root, 'css/foundation-tokens.css'), path.join(assets, 'foundation.css'));
    await cp(path.join(root, 'design-system/editions.json'), path.join(assets, 'editions.json'));
    await cp(path.join(root, 'design-system/language.it.json'), path.join(assets, 'language.it.json'));
    await cp(path.join(root, 'js/core'), path.join(assets, 'core'), { recursive: true });
  }
  const target = path.join(directory, 'wrangler.json');
  await writeFile(target, JSON.stringify(config, null, 2) + '\n');
  return { target, port: manifest.environments[name].port };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const [mode = 'check', name] = process.argv.slice(2);
    if (mode === 'check') {
      const { manifest, production } = await readInputs();
      validateEnvironments(manifest, production);
      for (const item of NAMES) environmentConfig(item, manifest, production);
      console.log('Quattro ambienti separati; produzione non ereditata.');
    } else if (['prepare', 'dev', 'dry-run'].includes(mode)) {
      const { target, port } = await prepareEnvironment(name);
      if (mode === 'prepare') console.log(target);
      else {
        const args = mode === 'dev'
          ? ['dev', '--config', target, '--local', '--ip', '127.0.0.1', '--port', String(port), '--persist-to', path.join(ROOT, '.fronda/state', name)]
          : ['deploy', '--config', target, '--dry-run', '--outdir', path.join(ROOT, '.fronda/build', name)];
        execFileSync(process.execPath, [path.join(ROOT, 'node_modules/wrangler/bin/wrangler.js'), ...args], { cwd: ROOT, stdio: 'inherit' });
      }
    } else throw Error('Comandi disponibili: check, prepare, dev, dry-run. Non esiste un comando deploy.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
