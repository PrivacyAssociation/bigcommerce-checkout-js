import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 60000, // 60 seconds timeout for each test
  snapshotPathTemplate: 'snapshots/{projectName}/{platform}/{arg}{ext}',

  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html', // See https://playwright.dev/docs/test-reporter
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'local-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://localhost:3000',
      },
    },

    {
      name: 'test-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'https://test.iapp.org',
      },
    },

    {
      name: 'production-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://iapp.org',
      },
    },

    // { alternative browsers, update the devices array for the above projects as needed
    //   use: { ...devices['Desktop Firefox'] },
    //   use: { ...devices['Desktop Safari'] },
    //   use: { ...devices['Pixel 5'] },
    //   use: { ...devices['iPhone 12'] },
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
