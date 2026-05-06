"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { checkPincodeServiceability, getAvailableCountries } from "@/services/deliveryZoneService";

interface LocationData {
  pincode: string;
  city: string;
  state: string;
  country: string;
  isServiceable: boolean;
}

interface LocationContextType {
  location: LocationData | null;
  availableCountries: string[];
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  isLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  checkPincode: (pincode: string, country?: string, city?: string | null, state?: string | null) => Promise<{
    serviceable: boolean;
    message: string;
    data: { city: string; state: string; country: string; pincode: string } | null;
  }>;
  saveLocation: (data: LocationData) => void;
  clearLocation: () => void;
  hasCheckedLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "deliveryLocation";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("India");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasCheckedLocation, setHasCheckedLocation] = useState(false);

  // Load from localStorage on mount & Fetch countries
  useEffect(() => {
    const init = async () => {
      // 1. Load from localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocation(parsed);
          setSelectedCountry(parsed.country || "India");
          setHasCheckedLocation(true);
        } else {
          setIsModalOpen(true);
        }
      } catch {
        setIsModalOpen(true);
      }

      // 2. Fetch available countries from delivery zones
      try {
        const countries = await getAvailableCountries();
        setAvailableCountries(countries);
        
        // If India is available, ensure it's selected if no location is stored
        if (countries.includes("India") && !location) {
          setSelectedCountry("India");
        } else if (countries.length > 0 && !location) {
          setSelectedCountry(countries[0]);
        }
      } catch (err) {
        console.error("Failed to fetch available countries:", err);
        setAvailableCountries(["India"]); // Fallback
      }
    };

    init();
  }, []);

  // Check pincode serviceability
  const checkPincode = useCallback(async (pincode: string, country?: string, city?: string | null, state?: string | null) => {
    setIsLoading(true);
    try {
      // Pass the optional country, city, and state filters to the service
      const result = await checkPincodeServiceability(pincode, country, city, state);
      
      return result;
    } catch {
      return {
        serviceable: false,
        message: "Failed to check pincode. Please try again.",
        data: null,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save location to state and localStorage
  const saveLocation = useCallback((data: LocationData) => {
    setLocation(data);
    setHasCheckedLocation(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save location to localStorage:", err);
    }
  }, []);

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    setHasCheckedLocation(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear location from localStorage:", err);
    }
  }, []);

  const contextValue = useMemo(() => ({
    location,
    availableCountries,
    selectedCountry,
    setSelectedCountry,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    checkPincode,
    saveLocation,
    clearLocation,
    hasCheckedLocation,
  }), [
    location,
    availableCountries,
    selectedCountry,
    isLoading,
    isModalOpen,
    checkPincode,
    saveLocation,
    clearLocation,
    hasCheckedLocation
  ]);

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
