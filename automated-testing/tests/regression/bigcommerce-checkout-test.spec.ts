import { test, expect, type Page } from '@playwright/test';
import testUserConfig from './user-config.json';

let loginId = '';

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

test.describe('BigCommerce Store checkout should trigger IAPP Account Login and return on success', () => {
  test('should navigate successfully to the BC Store and login via IAPP account at checkout', async ({
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

    // Use the checkout LoginForm control — a generic "Sign In" link can match the
    // storefront nav, which may still point at the legacy myiapp.org URL.
    const signIn = page.locator('#checkout-customer-continue');
    await signIn.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`Sign In href: ${await signIn.getAttribute('href')}`);
    await signIn.click();
    await iappAccountLogin(page, username, password);
    await checkoutUrlPromise; // wait for the checkout URL to be loaded after login

    // the same deal as MyIapp UI - need a manual GitHub Action Workflow to update snapshots on a linux os
    // shipping elements should be loaded from S3 source after login
    await page
      .locator('#firstNameInput')
      .waitFor({ state: 'visible', timeout: 20000 }); // wait for some element on the checkout page that only appears when logged in, this is pretty brittle and could be improved with a more robust selector strategy

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

/**
 * Attach WAF bypass headers only for IAPP account/auth hosts.
 * Do NOT send them globally — that triggers CORS preflights against BC CDN,
 * fonts, and test-checkout.iapp.org and prevents checkout JS from loading.
 */
async function addWafHeaders(page: Page) {
  const wafHeaderValue = process.env.WAF_TOKEN ?? '';
  const cognitoWafHeaderValue = process.env.COGNITO_WAF_TOKEN ?? '';

  await page.route('**/*', async (route, request) => {
    if (!needsWafBypassHeaders(request.url())) {
      await route.continue();
      return;
    }

    const headers = {
      ...request.headers(),
      'x-myiapp-waf': wafHeaderValue,
      'x-myiapp-cognito-waf': cognitoWafHeaderValue,
    };
    await route.continue({ headers });
  });
}

function needsWafBypassHeaders(urlString: string): boolean {
  try {
    const { hostname } = new URL(urlString);
    // Checkout asset hosts must be excluded — they are loaded cross-origin from BC.
    if (
      hostname === 'checkout.iapp.org' ||
      hostname === 'test-checkout.iapp.org'
    ) {
      return false;
    }

    return (
      hostname === 'iapp.org' ||
      hostname === 'test.iapp.org' ||
      hostname === 'myiapp.org' ||
      hostname === 'test.myiapp.org' ||
      hostname.endsWith('.myiapp.org') ||
      hostname.endsWith('.iapp.org')
    );
  } catch {
    return false;
  }
}

/**
 * Completes Cognito Managed Login reached via /account/store?redirectPage=checkout.
 * Flow: username -> Next -> password -> Sign in, then redirect back to checkout.
 */
async function iappAccountLogin(page: Page, username: string, password: string) {
  // /account/store redirects to Cognito Managed Login (auth.myiapp.org/login or test equivalent).
  // Fail fast if we landed on Azure AD App Proxy — that means WAF bypass headers did not apply.
  await page.waitForURL(
    (url) =>
      /\/(login|account\/store)/.test(url.pathname) ||
      url.hostname.includes('login.microsoftonline.com'),
    { timeout: 20000 }
  );

  if (page.url().includes('login.microsoftonline.com')) {
    throw new Error(
      `Reached Azure AD App Proxy instead of Cognito Managed Login. WAF bypass headers may be missing. Current URL: ${page.url()}`
    );
  }

  const usernameInput = page.locator('input[name="username"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 20000 });
  await usernameInput.fill(username);

  // Cognito Managed Login uses a "Next" button on the username step
  await page.getByRole('button', { name: 'Next' }).click();

  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
  await passwordInput.fill(password);

  // Password step submit is labeled "Sign in" on Cognito Managed Login
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
