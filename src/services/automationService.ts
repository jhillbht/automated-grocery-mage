import { supabase } from "@/integrations/supabase/client";

interface Product {
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
}

interface Store {
  name: string;
  address: string;
  image: string;
}

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
      throw new Error('Failed to fetch Shipt credentials');
    }
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