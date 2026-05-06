"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./auth-provider";
import {
  Currency,
  getCurrencyByCode,
  getDefaultCurrency,
  formatCurrency as formatCurrencyUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
} from "@/lib/currency";

interface CurrencyContextType {
  currentCurrency: Currency | null;
  currencyCode: string;
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (
    amount: number,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      precision?: number;
    }
  ) => string;
  getCurrencySymbol: () => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuthContext();
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>("INR");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        let adminCurrencyCode = "INR";

        // Always try to get admin currency from API
        try {
          const axiosInstance = (await import("@/lib/axios")).default;
          const response = await axiosInstance.get(
            "/api/auth/admin/currency"
          );

          if (response.data.success && response.data.currency) {
            adminCurrencyCode = response.data.currency;
          }
        } catch {
          console.log("Could not fetch admin currency, using default");
        }

        // If user is admin and has currency in user data, use that
        if (isAuthenticated && user && user.role === "admin" && user.currency) {
          adminCurrencyCode = user.currency;
        }

        const currency = getCurrencyByCode(adminCurrencyCode);
        if (currency) {
          setCurrentCurrency(currency);
          setCurrencyCode(adminCurrencyCode);
          
         
        } else {
          // Fallback to default currency
          const defaultCurrency = getCurrencyByCode(getDefaultCurrency());
          const fallbackCode = getDefaultCurrency();
          setCurrentCurrency(defaultCurrency || null);
          setCurrencyCode(fallbackCode);
          
         
        }
      } catch (error) {
        console.error("Error initializing currency:", error);
        // Fallback to default
        const defaultCurrency = getCurrencyByCode(getDefaultCurrency());
        setCurrentCurrency(defaultCurrency || null);
        setCurrencyCode(getDefaultCurrency());
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, [user, isAuthenticated]);

  // Listen for user data updates from admin settings
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      if (updatedUser?.currency && updatedUser.currency !== currencyCode) {
        const currency = getCurrencyByCode(updatedUser.currency);
        if (currency) {
          setCurrentCurrency(currency);
          setCurrencyCode(updatedUser.currency);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      return () => {
        window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      };
    }
  }, [currencyCode]);

  const setCurrency = (newCurrencyCode: string) => {
    const currency = getCurrencyByCode(newCurrencyCode);
    if (currency) {
      setCurrentCurrency(currency);
      setCurrencyCode(newCurrencyCode);


      // Only admin can change currency - this will be saved via admin profile update
      console.log("Currency updated to:", newCurrencyCode);
    }
  };

  const formatCurrency = (
    amount: number,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      precision?: number;
    }
  ): string => {
    return formatCurrencyUtil(amount, currencyCode, options);
  };

  const getCurrencySymbol = (): string => {
    return getCurrencySymbolUtil(currencyCode);
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currencyCode,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
