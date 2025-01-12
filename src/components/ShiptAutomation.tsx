import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import GroceryList from './GroceryList';
import AutomationStatus from './AutomationStatus';
import StoreSelector from './store/StoreSelector';
import ProductList from './products/ProductList';
import LocationHandler from './automation/LocationHandler';
import StoreHandler from './automation/StoreHandler';
import { automationService } from '@/services/automationService';
import { Product, Store, Location } from '@/types/shipt';

const ShiptAutomation = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const { toast } = useToast();

  const handleGroceryList = async (groceryList: string) => {
    try {
      setStatus('running');
      setProgress(0);
      setErrorMessage('');

      const initialized = await automationService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize automation');
      }
      setProgress(40);

      const items = groceryList
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      setProgress(60);

      const { products: foundProducts, stores: foundStores, selectedStore: foundStore } = 
        await automationService.searchProducts(items, selectedStore?.name || '');
      
      setProducts(foundProducts);
      setStores(foundStores);
      if (!selectedStore) {
        setSelectedStore(foundStore);
      }
      
      setProgress(80);
      await automationService.close();
      setProgress(100);
      setStatus('completed');

      toast({
        title: "Success",
        description: `Found ${foundProducts.length} items at ${selectedStore?.name}`,
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
      <LocationHandler onLocationUpdate={setUserLocation} />
      
      <StoreHandler
        stores={stores}
        selectedStore={selectedStore}
        userLocation={userLocation}
        onStoreSelect={setSelectedStore}
      />
      
      <StoreSelector 
        stores={stores}
        selectedStore={selectedStore}
        onStoreSelect={setSelectedStore}
      />
      
      <GroceryList onSubmit={handleGroceryList} />
      
      <AutomationStatus 
        status={status} 
        progress={progress} 
        errorMessage={errorMessage}
      />
      
      {products.length > 0 && status === 'completed' && (
        <ProductList products={products} />
      )}
    </div>
  );
};

export default ShiptAutomation;