import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Store, Location } from '@/types/shipt';

interface StoreHandlerProps {
  stores: Store[];
  selectedStore: Store | null;
  userLocation: Location | null;
  onStoreSelect: (store: Store) => void;
}

const StoreHandler: React.FC<StoreHandlerProps> = ({ 
  stores, 
  selectedStore, 
  userLocation, 
  onStoreSelect 
}) => {
  const { toast } = useToast();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      const hebStores = stores.filter(store => 
        store.name.toLowerCase().includes('h-e-b')
      );

      if (hebStores.length > 0) {
        if (userLocation) {
          const nearestStore = findNearestStore(hebStores, userLocation);
          onStoreSelect(nearestStore);
          toast({
            title: "Store Selected",
            description: `Selected nearest H-E-B at ${nearestStore.address}`,
          });
        } else {
          onStoreSelect(hebStores[0]);
        }
      }
    }
  }, [stores, userLocation, selectedStore, onStoreSelect, toast]);

  return null;
};

export default StoreHandler;