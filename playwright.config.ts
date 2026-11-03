import { defineConfig } from '@playwright/test';

// Tests write orders, forms and products, so they only ever run against the separate test database.
if (process.env.MONGODB_DB !== 'boldmount_e2e') throw new Error('Run the tests with `npm run test:e2e` (uses the boldmount_e2e database).');

const PORT = 3200;

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
