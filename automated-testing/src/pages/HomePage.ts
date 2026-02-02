import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

const SELECTOR_PROMO_CARDS = '#promoCards';
const SELECTOR_HOME_HERO = '[data-testid="homepage-hero-section"]';
// TODO test-id are not unique, so we should not use them this way
// const SELECTOR_HOUSE_PROMO_CARDS = '[data-testid="housePromoCard"]';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateAndWaitForRender() {
    await this.page.goto('/');
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.waitForPageLoad();
  }

  header(): Locator {
    return this.page.locator(SELECTOR_HOME_HERO);
  }

  promoCards(): Locator {
    return this.page.locator(SELECTOR_PROMO_CARDS);
  }

  learnAboutMembershipLink(): Locator {
    return this.page.locator('a', {
      hasText: 'Learn about organizational membership',
    });
  }

  // wait for all coded elements to be visible
  async waitForPageLoad() {
    await this.waitForElement(this.utilNav());
    await this.waitForElement(this.mainNav());
    await this.waitForElement(this.header());
    await this.waitForElement(this.promoCards());
    await this.waitForElement(this.learnAboutMembershipLink());
    await this.waitForElement(this.footerAboutSection());
    await this.waitForElement(this.footerSocialSection());
    await this.waitForElement(this.footerQuickLinks());
  }
}
