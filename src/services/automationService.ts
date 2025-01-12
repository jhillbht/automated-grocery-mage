import { supabase } from "@/integrations/supabase/client";

export class AutomationService {
  private isConnected: boolean = false;
  private credentials: { username: string | null; password: string | null } = {
    username: null,
    password: null,
  };
  private maxRetries = 3;

  private async fetchCredentials(retryCount = 0): Promise<{ username: string; password: string }> {
    try {
      const { data: secrets, error } = await supabase
        .from('secrets')
        .select('name, value')
        .in('name', ['SHIPT_USERNAME', 'SHIPT_PASSWORD']);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to connect to database: ${error.message}`);
      }

      if (!secrets || secrets.length === 0) {
        if (retryCount < this.maxRetries) {
          console.log(`Retry attempt ${retryCount + 1} of ${this.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.fetchCredentials(retryCount + 1);
        }
        throw new Error('Shipt credentials not found in database. Please add them in the Supabase settings.');
      }

      const username = secrets.find(s => s.name === 'SHIPT_USERNAME')?.value;
      const password = secrets.find(s => s.name === 'SHIPT_PASSWORD')?.value;

      if (!username || !password) {
        throw new Error('Both Shipt username and password are required. Please check your credentials in Supabase.');
      }

      if (username.trim() === '' || password.trim() === '') {
        throw new Error('Shipt credentials cannot be empty. Please update them in Supabase.');
      }

      return { username, password };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching credentials');
    }
  }

  async initialize() {
    try {
      console.log('Initializing automation service...');
      
      const credentials = await this.fetchCredentials();
      this.credentials = credentials;
      
      console.log('Successfully loaded credentials');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async close() {
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isConnected = false;
    this.credentials = { username: null, password: null };
    console.log('Automation service closed');
  }

  async navigateToShipt() {
    if (!this.isConnected) {
      throw new Error('Automation service not initialized. Please initialize before navigating.');
    }
    
    if (!this.credentials.username || !this.credentials.password) {
      throw new Error('Missing Shipt credentials. Please check your credentials and try again.');
    }

    // Simulate navigation and login delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Successfully navigated to Shipt');
  }
}

export const automationService = new AutomationService();