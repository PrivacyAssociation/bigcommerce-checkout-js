import { test, expect, type Page } from '@playwright/test';
import testUserConfig from './user-config.json';

let loginId = '';

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const userProfile = testUserConfig.users[0]; // Assign one user per VU
  await addWafHeader(page); // needed to log in
  await page.goto('/');
  await page.evaluate(() => {
    // skip the "have you done this before?" prompts go to sign in directly
    window.localStorage.setItem('hasVisitedPrev', 'true');
  });
  await page.reload();

  const username = userProfile.username;
  loginId = username;
  const password = userProfile.password;

  await acceptOneTrustIfPresent(page);
  await myIappLogin(page, username, password);
  await page.waitForTimeout(2000); // wait for any API calls to finish
  await context.storageState({ path: 'storageState.json' });
  await page.close();
});

test.beforeEach(async ({ page }) => {
  await addWafHeader(page);
});

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

test.describe('MyIappDashboardNavigation', () => {
  test('should navigate successfully to the Dashboard page and display correct data related content (Visual Regression)', async ({
    browser,
  }) => {
    const authenticatedContext = await browser.newContext({
      storageState: 'storageState.json',
    });
    const page = await authenticatedContext.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`);
      else console.log(msg.text());
    });
    await addWafHeader(page);
    await navigateToMyIappPageWaitForLoad(page);
    await acceptOneTrustIfPresent(page);
    await page.waitForTimeout(5500);
    // TODO Validation
    // await expect(page).toHaveScreenshot(`myiapp-${loginId}-dashboard.png`);
    await authenticatedContext.close();
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

async function myIappLogin(page: Page, username: string, password: string) {
  await page
    .locator('button[type="button"]')
    .waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('button[type="button"]').click();

  // this will try until the test timeout is exceeded
  while (
    (await page.locator('input[name="username"]').inputValue()) != username
  ) {
    await page.waitForTimeout(200); // wait a few millis then try entering it again
    await page
      .locator('input[name="username"]')
      .waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[name="username"]').fill(username);
  }
  await page.locator('button[type="submit"]').click();

  while (
    (await page.locator('input[name="password"]').inputValue()) != password
  ) {
    await page.waitForTimeout(200); // wait a few millis then try entering it again
    await page
      .locator('input[name="password"]')
      .waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[name="password"]').fill(password);
  }
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
}

// TODO load BigCommerce store in TEST or PRODUCTION
// 'https://iapp-akeneo-sandbox.mybigcommerce.com/'
// 'https://store.iapp.org'
// 'https://sandbox-iapp.mybigcommerce.com/'
//
// TODO this will need to provide the preview code in TEST as it is in sandbox mode
async function navigateToStoreWaitForLoad(page: Page) {
  const homepageResponse = await page.goto('/');
  try {
    await page.waitForSelector('a[href="/certifications"]', {
      state: 'visible',
      timeout: 10000,
    });
  } catch (error) {
    // uncomment to debug login issues
    // await page.screenshot({
    //   path: `screenshots/success-${uuid}-${Date.now()}.png`,
    // });
    const allHeaders = homepageResponse!.headers();
    console.error(
      `StatusCode: ${homepageResponse!.status()}, Response Headers: ${JSON.stringify(
        allHeaders,
        null,
        2
      )}`
    );
    throw new Error(
      'Dashboard element not found after login; login via localStorage failed'
    );
  }
}

async function navigateToMyIappPageWaitForLoad(page: Page) {
  const homepageResponse = await page.goto('/');
  try {
    await page.waitForSelector('a[href="/certifications"]', {
      state: 'visible',
      timeout: 10000,
    });
  } catch (error) {
    // uncomment to debug login issues
    // await page.screenshot({
    //   path: `screenshots/success-${uuid}-${Date.now()}.png`,
    // });
    const allHeaders = homepageResponse!.headers();
    console.error(
      `StatusCode: ${homepageResponse!.status()}, Response Headers: ${JSON.stringify(
        allHeaders,
        null,
        2
      )}`
    );
    throw new Error(
      'Dashboard element not found after login; login via localStorage failed'
    );
  }
}

async function acceptOneTrustIfPresent(page: Page) {
  // if one trust banner is there, accept
  try {
    await page.waitForTimeout(200); // wait a few millis then try entering it again
    await page
      .locator('#onetrust-accept-btn-handler')
      .waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#onetrust-accept-btn-handler').click();
  } catch (err) {}
}
