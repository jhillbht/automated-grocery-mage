import React, { useState, useEffect } from 'react';
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
  name: string;
  address: string;
  image: string;
  latitude?: number;
  longitude?: number;
}

const ShiptAutomation = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get user's location when component mounts
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
    // Set default H-E-B store when stores are loaded
    if (stores.length > 0 && !selectedStore) {
      const hebStores = stores.filter(store => 
        store.name.toLowerCase().includes('h-e-b')
      );

      if (hebStores.length > 0) {
        if (userLocation) {
          // Find nearest H-E-B store based on location
          const nearestStore = findNearestStore(hebStores, userLocation);
          setSelectedStore(nearestStore);
          toast({
            title: "Store Selected",
            description: `Selected nearest H-E-B at ${nearestStore.address}`,
          });
        } else {
          // If no location, select first H-E-B store
          setSelectedStore(hebStores[0]);
        }
      }
    }
  }, [stores, userLocation, toast]);

  const findNearestStore = (stores: Store[], location: { latitude: number; longitude: number }): Store => {
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

      // Initialize browser
      const initialized = await automationService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize automation');
      }
      setProgress(40);

      // Parse grocery list into individual items
      const items = groceryList
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      setProgress(60);

      // Search for products using Edge Function
      const { products: foundProducts, stores: foundStores, selectedStore: foundStore } = 
        await automationService.searchProducts(items, selectedStore?.name || '');
      
      setProducts(foundProducts);
      setStores(foundStores);
      if (!selectedStore) {
        setSelectedStore(foundStore);
      }
      
      setProgress(80);

      // Close automation
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
      <div className="flex flex-col space-y-4">
        <label htmlFor="store-select" className="text-sm font-medium">
          Select your store
        </label>
        <Select 
          value={selectedStore?.name || ''} 
          onValueChange={(value) => {
            const store = stores.find(s => s.name === value);
            if (store) setSelectedStore(store);
          }}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.name} value={store.name}>
                <div className="flex items-center space-x-2">
                  {store.image && (
                    <img src={store.image} alt={store.name} className="w-6 h-6 rounded" />
                  )}
                  <div>
                    <div>{store.name}</div>
                    <div className="text-xs text-gray-500">{store.address}</div>
                  </div>
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