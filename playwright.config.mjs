import { defineConfig } from '@playwright/test';
import { prepareEnvironment } from './tools/foundation/environments.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { target: testConfig, port: testPort } = await prepareEnvironment('test', undefined, {
  port: Number(process.env.FRONDA_TEST_PORT || 8788),
});
const testOrigin = `http://localhost:${testPort}`;
const persist = process.env.FUNGAROLI_BROWSER_PERSIST || mkdtempSync(join(tmpdir(), 'fungaroli-browser-'));
process.env.FUNGAROLI_BROWSER_PERSIST=persist;
export default defineConfig({ testDir: './tests/browser', workers: 1, fullyParallel:true, timeout: process.env.CI ? 120000 : 60000, expect: {timeout:15000}, use: { screenshot:'only-on-failure', trace:'retain-on-failure', baseURL: testOrigin, launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] }, serviceWorkers: 'block' },
  webServer: { command: `npx wrangler dev --config "${testConfig}" --local --ip 127.0.0.1 --port ${testPort} --var APP_ORIGIN:${testOrigin} --var CMS_ADMIN_IDS:cms-test-admin --var CMS_EDITOR_IDS:cms-test-editor --persist-to ${persist}`, url: `${testOrigin}/api/community/status`, timeout: 60000, reuseExistingServer: false }, reporter: 'list' });
