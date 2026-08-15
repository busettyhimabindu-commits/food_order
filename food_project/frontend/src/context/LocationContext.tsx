import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserLocation {
  id?: number;
  displayName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDetected: boolean;
}

const DEFAULT_LOCATION: UserLocation = {
  displayName: 'MITS College Road, Madanapalle',
  address: 'Door No 4-12, MITS College Road',
  city: 'Madanapalle',
  state: 'Andhra Pradesh',
  pincode: '517325',
  lat: 13.5500,
  lng: 78.5000,
  isDetected: false,
};

interface LocationContextType {
  location: UserLocation;
  isDetecting: boolean;
  detectLiveLocation: () => Promise<UserLocation | null>;
  setManualLocation: (loc: Partial<UserLocation>) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation>(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_LOCATION;
      }
    }
    return DEFAULT_LOCATION;
  });

  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('user_location', JSON.stringify(location));
  }, [location]);

  // Prompt for live location on first render if not already detected
  useEffect(() => {
    const hasPrompted = localStorage.getItem('location_prompted');
    if (!hasPrompted && navigator.geolocation) {
      localStorage.setItem('location_prompted', 'true');
      detectLiveLocation();
    }
  }, []);

  const detectLiveLocation = (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return Promise.resolve(null);
    }

    setIsDetecting(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Call backend reverse-geocoding endpoint
            const res = await api.get(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            const geoData = res.data;
            
            const newLoc: UserLocation = {
              displayName: geoData.display_name || `${geoData.address}, ${geoData.city}`,
              address: geoData.address || 'Detected Location',
              city: geoData.city || 'Madanapalle',
              state: geoData.state || 'Andhra Pradesh',
              pincode: geoData.pincode || '517325',
              lat: latitude,
              lng: longitude,
              isDetected: true,
            };
            setLocation(newLoc);
            resolve(newLoc);
          } catch (error) {
            console.error('Failed to reverse geocode location:', error);
            const fallbackLoc: UserLocation = {
              ...DEFAULT_LOCATION,
              lat: latitude,
              lng: longitude,
              isDetected: true,
              displayName: `Live Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
            };
            setLocation(fallbackLoc);
            resolve(fallbackLoc);
          } finally {
            setIsDetecting(false);
          }
        },
        (error) => {
          console.warn('Geolocation permission denied or error:', error.message);
          setIsDetecting(false);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const setManualLocation = (newLoc: Partial<UserLocation>) => {
    setLocation((prev) => ({
      ...prev,
      ...newLoc,
      isDetected: false,
    }));
  };

  return (
    <LocationContext.Provider value={{ location, isDetecting, detectLiveLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
