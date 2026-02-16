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
      name: 'sandbox-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://iapp-akeneo-sandbox.mybigcommerce.com',
      },
    },
    {
      name: 'test-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://sandbox-iapp.mybigcommerce.com',
      },
    },
    {
      name: 'production-regression',
      testDir: './tests/regression/',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://store.iapp.org',
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
