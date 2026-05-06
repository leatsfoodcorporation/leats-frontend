import { useState, useEffect } from "react";

// Global cache to store currency and country across all components
let currencyCache: {
  symbol: string;
  currency: string;
  country: string;
  timestamp: number;
} | null = null;

// Cache duration: 5 minutes (in milliseconds)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Custom hook to fetch and cache admin currency and country
 * - Fetches data only once and caches it
 * - Reuses cached value across all components
 * - Auto-refreshes after 5 minutes
 * - Works even when user/admin is logged out
 *
 * @returns {string} Currency symbol (₹, $, €, etc.) - for backward compatibility
 * Use useCurrencyData() to get both currency and country
 */
export function useCurrency(): string {
  const [currencySymbol, setCurrencySymbol] = useState<string>("");

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Check if cache exists and is still valid
        const now = Date.now();
        if (currencyCache && now - currencyCache.timestamp < CACHE_DURATION) {
          // Use cached value
          setCurrencySymbol(currencyCache.symbol);
          return;
        }

        // Fetch from public currency endpoint (no authentication required)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/currency`
        );
        const data = await response.json();
        
        if (!data.success || !data.data?.currency) {
          console.error("Failed to fetch currency data");
          return;
        }

        const currency = data.data.currency;
        const countryData = data.data.country;
        const symbol =
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
          })
            .formatToParts(0)
            .find((part) => part.type === "currency")?.value || "";

        // Update cache
        currencyCache = {
          symbol,
          currency,
          country: countryData,
          timestamp: now,
        };

        setCurrencySymbol(symbol);
      } catch (error) {
        console.error("Error fetching currency:", error);
      }
    };

    fetchCurrency();
  }, []);

  return currencySymbol;
}

/**
 * Custom hook to fetch and cache admin currency and country data
 * - Returns both currency symbol and country
 * - Works even when user/admin is logged out
 *
 * @returns {object} { currencySymbol: string, country: string }
 */
export function useCurrencyData(): { currencySymbol: string; country: string } {
  const [currencySymbol, setCurrencySymbol] = useState<string>("");
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Check if cache exists and is still valid
        const now = Date.now();
        if (currencyCache && now - currencyCache.timestamp < CACHE_DURATION) {
          // Use cached value
          setCurrencySymbol(currencyCache.symbol);
          setCountry(currencyCache.country);
          return;
        }

        // Fetch from public currency endpoint (no authentication required)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/currency`
        );
        const data = await response.json();
        
        if (!data.success || !data.data?.currency) {
          console.error("Failed to fetch currency data");
          return;
        }

        const currency = data.data.currency;
        const countryData = data.data.country;
        const symbol =
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
          })
            .formatToParts(0)
            .find((part) => part.type === "currency")?.value || "";

        // Update cache
        currencyCache = {
          symbol,
          currency,
          country: countryData,
          timestamp: now,
        };

        setCurrencySymbol(symbol);
        setCountry(countryData);
      } catch (error) {
        console.error("Error fetching currency:", error);
      }
    };

    fetchCurrency();
  }, []);

  return { currencySymbol, country };
}

/**
 * Function to manually clear the currency cache
 * Useful when admin updates currency settings
 */
export function clearCurrencyCache(): void {
  currencyCache = null;
}

/**
 * Function to get cached currency and country without triggering a fetch
 * Returns null if cache doesn't exist
 */
export function getCachedCurrencyData(): { currencySymbol: string; country: string } | null {
  if (currencyCache && Date.now() - currencyCache.timestamp < CACHE_DURATION) {
    return {
      currencySymbol: currencyCache.symbol,
      country: currencyCache.country,
    };
  }
  return null;
}
