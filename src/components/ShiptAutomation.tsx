import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import GroceryList from './GroceryList';
import AutomationStatus from './AutomationStatus';
import { automationService } from '@/services/automationService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
}

interface Store {
  id: string;
  name: string;
  logo: string;
}

const STORES: Store[] = [
  { id: 'target', name: 'Target', logo: 'https://placehold.co/50x50?text=T' },
  { id: 'publix', name: 'Publix', logo: 'https://placehold.co/50x50?text=P' },
  { id: 'kroger', name: 'Kroger', logo: 'https://placehold.co/50x50?text=K' },
];

const ShiptAutomation = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('target');
  const { toast } = useToast();

  const handleGroceryList = async (groceryList: string) => {
    try {
      setStatus('running');
      setProgress(0);
      setErrorMessage('');

      // Initialize browser
      const initialized = await automationService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize automation');
      }
      setProgress(20);

      // Navigate to Shipt
      await automationService.navigateToShipt();
      setProgress(40);

      // Parse grocery list into individual items
      const items = groceryList
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      setProgress(60);

      // Search for products using Puppeteer
      const foundProducts = await automationService.searchProducts(items, selectedStore);
      setProducts(foundProducts);
      
      setProgress(80);

      // Close browser
      await automationService.close();
      setProgress(100);
      setStatus('completed');

      toast({
        title: "Success",
        description: `Found ${foundProducts.length} items at ${STORES.find(store => store.id === selectedStore)?.name}`,
      });
    } catch (error) {
      console.error('Automation error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to process grocery list");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process grocery list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <label htmlFor="store-select" className="text-sm font-medium">
          Select your store
        </label>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {STORES.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                <div className="flex items-center space-x-2">
                  <img src={store.logo} alt={store.name} className="w-6 h-6 rounded" />
                  <span>{store.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <GroceryList onSubmit={handleGroceryList} />
      <AutomationStatus 
        status={status} 
        progress={progress} 
        errorMessage={errorMessage}
      />
      
      {products.length > 0 && status === 'completed' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Found Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, index) => (
              <div 
                key={index}
                className="flex flex-col bg-white rounded-lg shadow overflow-hidden"
              >
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-lg">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Qty: {product.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-span-full mt-4 p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>
                  ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiptAutomation;
