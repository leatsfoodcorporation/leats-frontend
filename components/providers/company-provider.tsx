"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuthContext } from "./auth-provider";

interface CompanyContextType {
  companyName: string;
  isLoading: boolean;
  getCompanyName: () => string;
  updateCompanyName: (name: string) => void;
  detectCompanyName: () => Promise<string>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompanyContext must be used within a CompanyProvider");
  }
  return context;
};

interface CompanyProviderProps {
  children: React.ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, getCompanyName: authGetCompanyName } = useAuthContext();
  const [companyName, setCompanyName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the company name detection
  const detectCompanyFromUser = useCallback(() => {
    if (isAuthenticated && user?.companyName?.trim()) {
      return user.companyName.trim();
    }
    return ""; // No default fallback
  }, [isAuthenticated, user?.companyName]);

  useEffect(() => {
    // Use auth provider's company name method first
    const authCompanyName = authGetCompanyName();
    if (authCompanyName && authCompanyName.trim()) {
      setCompanyName(authCompanyName);
    } else {
      const detectedName = detectCompanyFromUser();
      if (detectedName) {
        setCompanyName(detectedName);
      } else {
        // Set a default company name based on user role
        if (isAuthenticated && user?.role === 'admin') {
          setCompanyName(user?.name || "My Business");
        } else {
          setCompanyName("ECommerce Store");
        }
      }
    }
  }, [detectCompanyFromUser, authGetCompanyName, isAuthenticated, user]);

  // Listen for user data updates from admin settings
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      if (updatedUser?.companyName?.trim()) {
        setCompanyName(updatedUser.companyName.trim());
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      return () => {
        window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      };
    }
  }, []);

  const updateCompanyName = useCallback((name: string) => {
    if (name && name.trim()) {
      setCompanyName(name.trim());
    }
  }, []);

  const detectCompanyName = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      // Use setTimeout to avoid blocking
      setTimeout(() => {
        resolve(companyName);
      }, 0);
    });
  }, [companyName]);

  const getCompanyName = useCallback(() => {
    return companyName;
  }, [companyName]);

  const value: CompanyContextType = {
    companyName,
    isLoading,
    getCompanyName,
    updateCompanyName,
    detectCompanyName,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
