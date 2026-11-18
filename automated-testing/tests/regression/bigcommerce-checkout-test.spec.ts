import { test, expect, type Page } from '@playwright/test';
import testUserConfig from './user-config.json';

let loginId = '';

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
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

test.describe('BigCommerce Store checkout should trigger MyIapp Login and return on success', () => {
  test('should navigate successfully to the BC Store and login via MyIapp at checkout', async ({
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

    const userProfile = testUserConfig.users[0]; // Assign one user per VU
    const username = userProfile.username;
    loginId = username;
    const password = userProfile.password;

    await addWafHeaders(page);
    await navigateToStoreWaitForLoad(page);
    await acceptOneTrustIfPresent(page);
    await addAigpExamToCart(page);
    // if this direct link breaks, people are probably impacted so its likely fine having this in automation instead of clicking buttons in the UI to get here
    await page.goto('/checkout'); // "/checkout"

    // TODO can we even look at the ETag? and verify its the one we just deployed?
    const s3CheckoutUrl = process.env.BC_CHECKOUT_URL ?? '';

    await waitForApiCalls(page, [s3CheckoutUrl]);
    const checkoutUrlPromise = page.waitForURL(/\/checkout/, {timeout: 30000});

    // wait for the sign in button to appear and click it
    await page.getByRole('link', { name: 'Sign In' }).click();
    await myIappLogin(page, username, password);
    await page.waitForTimeout(2000); // wait to visually confirm logged in state
    await checkoutUrlPromise; // wait for the checkout URL to be loaded after login

    // the same deal as MyIapp UI - need a manual GitHub Action Workflow to update snapshots on a linux os
    // shipping elements should be loaded from S3 source after login
    await page
      .locator('#firstNameInput')
      .waitFor({ state: 'visible', timeout: 20000 }); // wait for some element on the checkout page that only appears when logged in, this is pretty brittle and could be improved with a more robust selector strategy

    await page.waitForTimeout(2000); // wait to visually confirm logged in state
    await page
      .locator('#checkout-shipping-continue')
      .waitFor({ state: 'visible', timeout: 10000 }); // wait for some element on the checkout page that only appears when logged in, this is pretty brittle and could be improved with a more robust selector strategy
    
    const isVisualRegressionEnabled: string = process.env.VISUAL_REGRESSION ?? '';

    if( isVisualRegressionEnabled.toLowerCase() === 'true') {
      await expect(page).toHaveScreenshot(
        `bigcommerce-${loginId}-checkout-logged-in.png`
      );
    }
    await authenticatedContext.close();
  });
});

async function waitForApiCalls(page: Page, expectedApiCalls: string[]) {
  try {
    await page.waitForFunction((expectedApiCalls) => {
      const entries = performance.getEntriesByType('resource'); // Get all performance entries
      const apiCalls = entries.filter((entry) =>
        expectedApiCalls.some((term) => entry.name.includes(term))
      );

      return apiCalls.length >= expectedApiCalls.length;
    }, expectedApiCalls);
  } catch (error) {
    console.error(
      `Failed to load all expected backend API calls page: ${JSON.stringify(expectedApiCalls)}`
    );
  }
}

// test is behind internal WAF, punch a hole for this test when invoked from GitHub Actions
async function addWafHeaders(page: Page) {
  const wafHeaderValue = process.env.WAF_TOKEN ?? '';
  const cognitoWafHeaderValue = process.env.COGNITO_WAF_TOKEN ?? '';

  await page.route('**/*', (route, request) => {
    const originalHeaders = request.headers();
    originalHeaders['x-myiapp-cognito-waf'] = cognitoWafHeaderValue;
    originalHeaders['x-myiapp-waf'] = wafHeaderValue;
    route.continue({ headers: originalHeaders });
  });
}

async function myIappLogin(page: Page, username: string, password: string) {
  // /account/store redirects to Cognito Managed Login. Nonprod host is test-auth.iapp.org.
  const loginUrl =
    process.env.RUNTIME_ENVIRONMENT === 'production'
      ? /https:\/\/auth\.myiapp\.org\/login/
      : /https:\/\/test-auth\.iapp\.org\/login/;
  await page.waitForURL(loginUrl, { timeout: 20000 });

  const usernameInput = page.locator('input[name="username"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 20000 });
  await usernameInput.fill(username);
  await page.getByRole('button', { name: 'Next' }).click();

  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function navigateToStoreWaitForLoad(page: Page) {
  const certificationStorePageResponse = await page.goto('/aigp-exam/');
  // TODO enter preview code if in TEST environment
  try {
    await page.waitForSelector('#guestTkn', {
      state: 'visible',
      timeout: 10000,
    });
    const bcPreviewCode: string = process.env.BC_PREVIEW_CODE ?? ''; // TODO add in github secrets

    await page.fill('#guestTkn', bcPreviewCode);
    await page.waitForTimeout(500); // wait a bit before submitting
    await page.locator('input[value="Submit"]').click(); // TODO submit and wait for for load below
    await page.waitForTimeout(10000); // wait a bit before next steps
  } catch (error) {
    // ignore if not present
  }
}

async function addAigpExamToCart(page: Page) {
  await page
    .locator('input[type="submit"][value="Add to Cart"]')
    .scrollIntoViewIfNeeded();
  await page
    .locator('input[type="submit"][value="Add to Cart"]')
    .waitFor({ state: 'visible', timeout: 10000 });
  // selects "Yes" from dropdown - Have you ever attempted the AIGP exam before OR are you a holder of any other IAPP certification?: (Required)
  await page.evaluate(() => window.scrollBy(0, 500)); // Scrolls down by 500 pixels
  // TODO this varies by environment and is very brittle, if this test breaks it may be because of this selector, we should consider adding a more robust selector strategy for this in the future
  const runtime = process.env.RUNTIME_ENVIRONMENT;
  if (runtime === 'production') {
    await page.selectOption('#attribute_select_287', { label: 'Yes' }); //attribute_select_287 in prod...this does not bode well
  } else {
    await page.selectOption('#attribute_select_2529', { label: 'Yes' }); //attribute_select_287 in prod...this does not bode well
  }
  await page.locator('input[type="submit"][value="Add to Cart"]').click();
  // wait for "added to cart" confirmation popup screen before navigating to checkout
  await page
    .locator('a[href*="/checkout"]')
    .waitFor({ state: 'visible', timeout: 10000 });
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
