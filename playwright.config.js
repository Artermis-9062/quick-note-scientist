import { defineConfig, devices } from '@playwright/test';

// Run Chromium against a dedicated Vite server, without reusing another worktree's app.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 15000,
  expect: { timeout: 3000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  // Each test receives its own context and localStorage; failures retain debugging evidence.
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Playwright starts and stops this server; a busy port fails rather than testing the wrong app.
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
