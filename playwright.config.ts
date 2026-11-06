import { defineConfig } from '@playwright/test';

// Tests write orders, forms and products, so they only ever run against the separate test database.
if (!/^boldmount_e2e(_[a-z0-9]+)?$/.test(process.env.MONGODB_DB ?? '')) throw new Error('Run the tests with `npm run test:e2e` (uses the boldmount_e2e database).');

// E2E_PORT / E2E_DB let a second copy of the repo run its own suite at the same time.
const PORT = Number(process.env.E2E_PORT) || 3200;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // One shared test database: run the files one after another.
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: `npx next start -p ${PORT}`, url: `http://localhost:${PORT}/api/health`, reuseExistingServer: false, timeout: 60_000 },
});
