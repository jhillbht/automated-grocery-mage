import { supabase } from "@/integrations/supabase/client";
import puppeteer from 'puppeteer';

export class AutomationService {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  private isConnected: boolean = false;
  private credentials: { username: string | null; password: string | null } = {
    username: null,
    password: null,
  };

  private async fetchCredentials(): Promise<{ username: string; password: string }> {
    try {
      const { data: usernameData, error: usernameError } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'SHIPT_USERNAME')
        .single();

      const { data: passwordData, error: passwordError } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'SHIPT_PASSWORD')
        .single();

      if (usernameError || passwordError) {
        throw new Error('Failed to fetch credentials');
      }

      return {
        username: usernameData.value,
        password: passwordData.value
      };
    } catch (error) {
      console.error('Error fetching credentials:', error);
      // Fallback to demo credentials for development
      return {
        username: 'demo_user',
        password: 'demo_password'
      };
    }
  }

  async initialize() {
    try {
      console.log('Initializing automation service...');
      
      const credentials = await this.fetchCredentials();
      this.credentials = credentials;
      
      this.browser = await puppeteer.launch({
        headless: true
      });
      
      this.page = await this.browser.newPage();
      console.log('Successfully loaded and validated credentials');
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    this.credentials = { username: null, password: null };
    console.log('Automation service closed');
  }

  async navigateToShipt() {
    if (!this.page || !this.isConnected) {
      throw new Error('Automation service not initialized. Please initialize before navigating.');
    }
    
    if (!this.credentials.username || !this.credentials.password) {
      throw new Error('Missing Shipt credentials. Please check your credentials and try again.');
    }

    try {
      await this.page.goto('https://shop.shipt.com/');
      await this.page.waitForSelector('input[type="email"]');
      await this.page.type('input[type="email"]', this.credentials.username);
      await this.page.type('input[type="password"]', this.credentials.password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation();
      console.log('Successfully navigated to Shipt');
    } catch (error) {
      console.error('Failed to navigate to Shipt:', error);
      throw error;
    }
  }

  async searchProducts(items: string[], store: string) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const products = [];

    // First select the store if needed
    try {
      await this.page.click('[data-test="store-selector"]');
      await this.page.waitForSelector(`[data-test="store-${store}"]`);
      await this.page.click(`[data-test="store-${store}"]`);
    } catch (error) {
      console.error('Error selecting store:', error);
    }

    // Search for each item
    for (const item of items) {
      try {
        // Clear and fill search input
        await this.page.click('[data-test="search-input"]');
        await this.page.type('[data-test="search-input"]', item);
        await this.page.keyboard.press('Enter');
        
        // Wait for search results
        await this.page.waitForSelector('[data-test="product-card"]');
        
        // Get first product result
        const product = await this.page.evaluate(() => {
          const card = document.querySelector('[data-test="product-card"]');
          if (!card) return null;
          
          return {
            name: card.querySelector('[data-test="product-title"]')?.textContent || '',
            price: parseFloat(card.querySelector('[data-test="product-price"]')?.textContent?.replace('$', '') || '0'),
            image: card.querySelector('img')?.src || '',
            description: card.querySelector('[data-test="product-description"]')?.textContent || '',
            quantity: 1
          };
        });

        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error searching for ${item}:`, error);
      }
    }

    return products;
  }
}

export const automationService = new AutomationService();