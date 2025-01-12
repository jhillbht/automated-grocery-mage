import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Location } from '@/types/shipt';

interface LocationHandlerProps {
  onLocationUpdate: (location: Location) => void;
}

const LocationHandler: React.FC<LocationHandlerProps> = ({ onLocationUpdate }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationUpdate({
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
  }, [onLocationUpdate, toast]);

  return null;
};

export default LocationHandler;