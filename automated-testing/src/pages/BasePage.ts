import { Locator, Page } from '@playwright/test';

export const SELECTOR_MAIN_NAV = '[data-testid="mainNav"]',
  SELECTOR_UTIL_NAV = '[data-testid="utilNav"]',
  SELECTOR_FOOTER_QUICK_LINKS_SECTION = '[data-testid="QuickLinksSection"]',
  SELECTOR_FOOTER_SOCIAL_SECTION = '[data-testid="SocialSection"]',
  SELECTOR_FOOTER_ABOUT_SECTION = '[data-testid="LogoAndAboutSection"]';

export abstract class BasePage {
  readonly page: Page;
  readonly urlPath: string;

  constructor(page: Page, urlPath: string = '/') {
    this.page = page;
    this.urlPath = urlPath;
  }

  async waitForElement(locator: Locator) {
    try {
      await locator.waitFor({
        state: 'visible',
        timeout: 10000,
      });
    } catch (error) {
      throw new Error(
        `Locator ${locator.toString()} not visible after waiting: ${JSON.stringify(error)}`
      );
    }
  }

  mainNav(): Locator {
    return this.page.locator(SELECTOR_MAIN_NAV);
  }

  utilNav(): Locator {
    return this.page.locator(SELECTOR_UTIL_NAV);
  }

  footerAboutSection(): Locator {
    return this.page.locator(SELECTOR_FOOTER_ABOUT_SECTION);
  }

  footerSocialSection(): Locator {
    return this.page.locator(SELECTOR_FOOTER_SOCIAL_SECTION);
  }

  footerQuickLinks(): Locator {
    return this.page.locator(SELECTOR_FOOTER_QUICK_LINKS_SECTION);
  }

  abstract waitForPageLoad(): Promise<void>;
  abstract navigateAndWaitForRender(): Promise<void>;
  abstract header(): Locator;

  async waitForUrl() {
    console.log(`DEBUG: waiting for URL: ${this.urlPath}`);
    await this.page.waitForURL(`${this.urlPath}`);
  }
}
