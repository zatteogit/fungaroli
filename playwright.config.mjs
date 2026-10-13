import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const persist = mkdtempSync(join(tmpdir(), 'fungaroli-browser-'));
export default defineConfig({ testDir: './tests/browser', workers: 1, timeout: 60000, use: { baseURL: 'http://localhost:8788', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] }, serviceWorkers: 'block' },
  webServer: { command: `npx wrangler dev --local --ip 127.0.0.1 --port 8788 --var APP_ORIGIN:http://localhost:8788 --persist-to ${persist}`, url: 'http://localhost:8788/api/community/status', timeout: 60000, reuseExistingServer: false }, reporter: 'list' });
