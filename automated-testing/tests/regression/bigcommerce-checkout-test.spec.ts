import { test, type Page } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = testInfo.outputPath(
      `failure-${testInfo.testId}.png`
    );
    // Add screenshot to the report.
    testInfo.attachments.push({
      name: 'screenshot',
      path: screenshotPath,
      contentType: 'image/png',
    });
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
});

test.beforeEach(async ({ page }) => {
  await addWafHeader(page);
});

test.describe('IappHomePageNavigation', () => {
  test('should navigate successfully to the "home" page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateAndWaitForRender();
    await homePage.learnAboutMembershipLink().click();
  });
});

// test is behind internal WAF, punch a hole for this test when invoked from GitHub Actions
async function addWafHeader(page: Page) {
  const wafHeaderValue = process.env.WAF_TOKEN ?? '';
  await page.route('**/*', (route, request) => {
    const originalHeaders = request.headers();
    originalHeaders['x-iapp-waf'] = wafHeaderValue;
    route.continue({ headers: originalHeaders });
  });
}
