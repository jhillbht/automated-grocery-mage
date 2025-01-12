import React from 'react';
import { Store } from '@/types/shipt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StoreSelectorProps {
  stores: Store[];
  selectedStore: Store | null;
  onStoreSelect: (store: Store) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ 
  stores, 
  selectedStore, 
  onStoreSelect 
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <label htmlFor="store-select" className="text-sm font-medium">
        Select your store
      </label>
      <Select 
        value={selectedStore?.name || ''} 
        onValueChange={(value) => {
          const store = stores.find(s => s.name === value);
          if (store) onStoreSelect(store);
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
  );
};

export default StoreSelector;