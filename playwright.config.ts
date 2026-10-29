import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './tests/browser',
 timeout: 30000,
 use: { baseURL: 'http://127.0.0.1:8770', trace: 'retain-on-failure' },
 reporter: [['list'], ['html', { open: 'never' }]],
 projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
 ],
 webServer: { command: 'node scripts/serve-preview.mjs', url: 'http://127.0.0.1:8770', reuseExistingServer: !process.env.CI },
});
