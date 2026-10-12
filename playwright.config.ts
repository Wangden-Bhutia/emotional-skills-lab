import { defineConfig, devices } from '@playwright/test';
const remote = process.env.BASE_URL;
export default defineConfig({
  testDir: 'tests/e2e', timeout: 60000, retries: remote ? 1 : 0,
  use: { baseURL: remote ?? 'http://localhost:4173/emotional-skills-lab/', ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
  projects: [{ name: 'chromium-mobile', use: { browserName: 'chromium' } }],
  webServer: remote ? undefined : { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/emotional-skills-lab/', reuseExistingServer: true },
});
