import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const persist = process.env.FUNGAROLI_BROWSER_PERSIST || mkdtempSync(join(tmpdir(), 'fungaroli-browser-'));
process.env.FUNGAROLI_BROWSER_PERSIST=persist;
export default defineConfig({ testDir: './tests/browser', workers: 1, timeout: 60000, use: { screenshot:'only-on-failure', trace:'retain-on-failure', baseURL: 'http://localhost:8788', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] }, serviceWorkers: 'block' },
  webServer: { command: `npx wrangler dev --local --ip 127.0.0.1 --port 8788 --var APP_ORIGIN:http://localhost:8788 --var CMS_ADMIN_IDS:cms-test-admin --var CMS_EDITOR_IDS:cms-test-editor --persist-to ${persist}`, url: 'http://localhost:8788/api/community/status', timeout: 60000, reuseExistingServer: false }, reporter: 'list' });
