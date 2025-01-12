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

        const username = usernameResponse.data?.value;
        const password = passwordResponse.data?.value;

        if (!username || !password) {
          throw new Error('Credentials not found in database. Please ensure both SHIPT_USERNAME and SHIPT_PASSWORD are set.');
        }

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (trimmedUsername === '' || trimmedPassword === '') {
          throw new Error('Credentials cannot be empty strings. Please ensure both username and password have valid values.');
        }

        console.log('Successfully fetched and validated Shipt credentials');
        return {
          username: trimmedUsername,
          password: trimmedPassword
        };

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

  async initialize() {
    try {
      console.log('Initializing automation service...');
      const credentials = await this.fetchCredentials();
      this.credentials = credentials;
      console.log('Successfully initialized automation service with valid credentials');
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

    console.log('Calling Shipt automation with store:', store);
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

    console.log('Successfully retrieved products from Shipt');
    return data;
  }

  async close() {
    this.credentials = { username: null, password: null };
    console.log('Automation service closed');
  }
}

export const automationService = new AutomationService();