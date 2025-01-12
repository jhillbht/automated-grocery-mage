import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import GroceryList from './GroceryList';
import AutomationStatus from './AutomationStatus';
import { automationService } from '@/services/automationService';

interface Product {
  name: string;
  price: number;
  quantity: number;
}

const ShiptAutomation = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  const handleGroceryList = async (groceryList: string) => {
    try {
      setStatus('running');
      setProgress(0);

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

      // Mock product search and price extraction
      const foundProducts: Product[] = items.map(item => ({
        name: item,
        price: Math.random() * 10 + 1, // Mock price between $1-$11
        quantity: 1
      }));

      setProducts(foundProducts);
      setProgress(80);

      // Mock adding items to cart
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);
      setStatus('completed');

      toast({
        title: "Success",
        description: `Added ${items.length} items to cart`,
      });
    } catch (error) {
      console.error('Automation error:', error);
      setStatus('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process grocery list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <GroceryList onSubmit={handleGroceryList} />
      <AutomationStatus status={status} progress={progress} />
      
      {products.length > 0 && status === 'completed' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Found Products</h3>
          <div className="space-y-2">
            {products.map((product, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-4 bg-white rounded-lg shadow"
              >
                <span>{product.name}</span>
                <span className="font-semibold">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-semibold">
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