import puppeteer from 'puppeteer';

export class AutomationService {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });
      this.page = await this.browser.newPage();
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async navigateToShipt() {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.goto('https://shipt.com');
  }
}

export const automationService = new AutomationService();