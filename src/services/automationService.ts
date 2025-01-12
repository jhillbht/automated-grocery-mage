import { supabase } from "@/integrations/supabase/client";
import type { Product, Store } from '@/types/shipt';

interface ShiptResponse {
  products: Product[];
  stores: Store[];
  selectedStore: Store;
}

export class AutomationService {
  private credentials: { username: string | null; password: string | null } = {
    username: null,
    password: null,
  };

  private async fetchCredentials(retryCount = 3): Promise<{ username: string; password: string }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${retryCount} to fetch Shipt credentials`);
        
        const [usernameResponse, passwordResponse] = await Promise.all([
          supabase
            .from('secrets')
            .select('value')
            .eq('name', 'SHIPT_USERNAME')
            .maybeSingle(),
          supabase
            .from('secrets')
            .select('value')
            .eq('name', 'SHIPT_PASSWORD')
            .maybeSingle()
        ]);

        if (usernameResponse.error) {
          console.error('Error fetching username:', usernameResponse.error);
          throw new Error(`Failed to fetch username: ${usernameResponse.error.message}`);
        }

        if (passwordResponse.error) {
          console.error('Error fetching password:', passwordResponse.error);
          throw new Error(`Failed to fetch password: ${passwordResponse.error.message}`);
        }

        if (!usernameResponse.data || !passwordResponse.data) {
          throw new Error('Credentials not found in database');
        }

        const credentials = {
          username: usernameResponse.data.value,
          password: passwordResponse.data.value
        };

        if (!this.validateCredentials(credentials)) {
          throw new Error('Invalid credential format');
        }

        console.log('Successfully fetched and validated Shipt credentials');
        return credentials;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        console.error(`Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to fetch Shipt credentials after ${retryCount} attempts. Last error: ${lastError?.message}`);
  }

  private validateCredentials(credentials: { username: string; password: string }): boolean {
    return (
      typeof credentials.username === 'string' &&
      typeof credentials.password === 'string' &&
      credentials.username.length > 0 &&
      credentials.password.length > 0
    );
  }

  async initialize() {
    try {
      console.log('Initializing automation service...');
      const credentials = await this.fetchCredentials();
      this.credentials = credentials;
      console.log('Successfully loaded and validated credentials');
      return true;
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      throw error;
    }
  }

  async searchProducts(items: string[], store: string): Promise<ShiptResponse> {
    if (!this.credentials.username || !this.credentials.password) {
      throw new Error('Automation service not properly initialized. Please ensure credentials are set.');
    }

    const { data, error } = await supabase.functions.invoke('shipt-automation', {
      body: {
        items,
        store,
        credentials: this.credentials
      }
    });

    if (error) {
      console.error('Error calling shipt-automation function:', error);
      throw error;
    }

    return data;
  }

  async close() {
    this.credentials = { username: null, password: null };
    console.log('Automation service closed');
  }
}

export const automationService = new AutomationService();