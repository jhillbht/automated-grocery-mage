import { supabase } from "@/integrations/supabase/client";
import type { Product, Store } from '@/types/shipt';

interface ShiptResponse {
  products: Product[];
  stores: Store[];
  selectedStore: Store;
}

export class AutomationService {
  private credentials = {
    username: 'shipt_test_user',  // Hardcoded test credentials
    password: 'shipt_test_pass'   // Hardcoded test credentials
  };

  async initialize() {
    try {
      console.log('Initializing automation service...');
      return true;
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      throw error;
    }
  }

  async searchProducts(items: string[], store: string): Promise<ShiptResponse> {
    if (!this.credentials.username || !this.credentials.password) {
      throw new Error('Automation service not properly initialized');
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
    console.log('Automation service closed');
  }
}

export const automationService = new AutomationService();