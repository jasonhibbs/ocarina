import { defineConfig, devices } from '@playwright/test'

const port = 4173

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    launchOptions: {
      // Let the synth start in headless browsers without a real gesture.
      args: ['--autoplay-policy=no-user-gesture-required'],
      // Use a preinstalled browser instead of Playwright's own, if set.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@mobile/,
    },
    // Chromium emulating a phone: touch events, small viewport.
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grepInvert: /@desktop/,
    },
  ],
  // Tests run against the production build, service worker included.
  webServer: {
    command: `npm run build-only && npm run preview -- --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
  },
})
