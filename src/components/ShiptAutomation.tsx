import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import GroceryList from './GroceryList';
import AutomationStatus from './AutomationStatus';
import StoreSelector from './store/StoreSelector';
import ProductList from './products/ProductList';
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Defaulting to first H-E-B store.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      const hebStores = stores.filter(store => 
        store.name.toLowerCase().includes('h-e-b')
      );

      if (hebStores.length > 0) {
        if (userLocation) {
          const nearestStore = findNearestStore(hebStores, userLocation);
          setSelectedStore(nearestStore);
          toast({
            title: "Store Selected",
            description: `Selected nearest H-E-B at ${nearestStore.address}`,
          });
        } else {
          setSelectedStore(hebStores[0]);
        }
      }
    }
  }, [stores, userLocation, toast]);

  const findNearestStore = (stores: Store[], location: Location): Store => {
    return stores.reduce((nearest, store) => {
      if (!store.latitude || !store.longitude) return nearest;
      
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        store.latitude,
        store.longitude
      );
      
      const nearestDistance = calculateDistance(
        location.latitude,
        location.longitude,
        nearest.latitude!,
        nearest.longitude!
      );
      
      return distance < nearestDistance ? store : nearest;
    }, stores[0]);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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