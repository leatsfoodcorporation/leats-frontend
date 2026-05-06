// Currency configuration and utilities
import currencyCodes from 'currency-codes';
import getSymbolFromCurrency from 'currency-symbol-map';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  flag?: string;
}

// Get all supported currencies from the currency-codes package
const getAllCurrencies = (): Currency[] => {
  const currencies = currencyCodes.data;
  
  // Filter and map to our Currency interface
  return currencies
    .filter(currency => currency && currency.code && currency.currency)
    .map(currency => ({
      code: currency.code,
      name: currency.currency,
      symbol: getSymbolFromCurrency(currency.code) || currency.code,
      symbolPosition: 'before' as const,
      decimalPlaces: getDecimalPlaces(currency.code),
      flag: getFlagEmoji(currency.code)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get decimal places for specific currencies
const getDecimalPlaces = (currencyCode: string): number => {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX'];
  return zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2;
};

// Get flag emoji for currency (basic mapping for major currencies)
const getFlagEmoji = (currencyCode: string): string => {
  const flagMap: Record<string, string> = {
    'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
    'INR': '🇮🇳', 'CAD': '🇨🇦', 'AUD': '🇦🇺', 'CHF': '🇨🇭',
    'CNY': '��', 'SGD': '🇸🇬', 'HKD': '🇭🇰', 'NZD': '🇳🇿',
    'SEK': '🇸🇪', 'NOK': '🇳🇴', 'DKK': '🇩🇰', 'PLN': '🇵🇱',
    'CZK': '🇨🇿', 'HUF': '🇭🇺', 'RUB': '🇷🇺', 'BRL': '🇧🇷',
    'MXN': '🇲🇽', 'ZAR': '🇿🇦', 'KRW': '🇰🇷', 'THB': '🇹🇭',
    'MYR': '🇲🇾', 'IDR': '🇮🇩', 'PHP': '🇵🇭', 'VND': '🇻🇳',
    'AED': '🇦🇪', 'SAR': '🇸🇦', 'EGP': '🇪🇬', 'TRY': '🇹🇷'
  };
  return flagMap[currencyCode] || '🌍';
};

// Popular currencies that should appear first
const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'];

// Get all currencies with popular ones first
export const SUPPORTED_CURRENCIES: Currency[] = (() => {
  const allCurrencies = getAllCurrencies();
  const popularCurrencies = allCurrencies.filter(c => POPULAR_CURRENCIES.includes(c.code));
  const otherCurrencies = allCurrencies.filter(c => !POPULAR_CURRENCIES.includes(c.code));
  
  // Sort popular currencies by the order in POPULAR_CURRENCIES array
  const sortedPopular = popularCurrencies.sort((a, b) => 
    POPULAR_CURRENCIES.indexOf(a.code) - POPULAR_CURRENCIES.indexOf(b.code)
  );
  
  return [...sortedPopular, ...otherCurrencies];
})();

export const DEFAULT_CURRENCY = 'INR';

// Get currency by code
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};

// Format amount with currency using Intl.NumberFormat
export const formatCurrency = (
  amount: number, 
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    precision?: number;
    locale?: string;
  }
): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return amount.toString();
  }

  const {
    showSymbol = true,
    showCode = false,
    precision,
    locale
  } = options || {};

  // Determine the appropriate locale based on currency
  const formatLocale = locale || (currencyCode === 'INR' ? 'en-IN' : 'en-US');
  
  // Determine precision - remove decimals if amount is a whole number
  const isWholeNumber = amount % 1 === 0;
  const formatPrecision = precision !== undefined ? precision : (isWholeNumber ? 0 : currency.decimalPlaces);

  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(formatLocale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits: formatPrecision,
      maximumFractionDigits: formatPrecision,
    });

    let result = formatter.format(amount);

    // Add currency code if requested and not already included
    if (showCode && !result.includes(currencyCode)) {
      result = `${result} ${currencyCode}`;
    }

    return result;
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    console.warn('Currency formatting failed, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    let formattedAmount: string;
    
    if (currencyCode === 'INR') {
      // Custom Indian number formatting for fallback
      formattedAmount = formatIndianNumber(amount, formatPrecision);
    } else {
      formattedAmount = amount.toLocaleString(formatLocale, {
        minimumFractionDigits: formatPrecision,
        maximumFractionDigits: formatPrecision,
      });
    }

    let result = formattedAmount;

    if (showSymbol) {
      result = `${currency.symbol}${result}`;
    }

    if (showCode) {
      result = `${result} ${currencyCode}`;
    }

    return result;
  }
};

// Helper function for Indian number formatting (fallback)
const formatIndianNumber = (amount: number, precision: number): string => {
  const parts = amount.toFixed(precision).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with Indian comma placement
  let formattedInteger = '';
  const reversed = integerPart.split('').reverse();
  
  for (let i = 0; i < reversed.length; i++) {
    if (i === 3) {
      formattedInteger = ',' + formattedInteger;
    } else if (i > 3 && (i - 3) % 2 === 0) {
      formattedInteger = ',' + formattedInteger;
    }
    formattedInteger = reversed[i] + formattedInteger;
  }
  
  // Add decimal part if precision > 0 and not all zeros
  if (precision > 0 && decimalPart && !decimalPart.split('').every(d => d === '0')) {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  return formattedInteger;
};

// Get currency symbol using the currency-symbol-map package
export const getCurrencySymbol = (currencyCode: string): string => {
  return getSymbolFromCurrency(currencyCode) || currencyCode;
};

// Get currency name
export const getCurrencyName = (currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.name || currencyCode;
};

// Convert currency for display (placeholder for future exchange rate integration)
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  // For now, return the same amount
  // In the future, integrate with exchange rate API like exchangerate-api.com
  if (fromCurrency === toCurrency) {
    return amount;
  }
  return amount;
};

// Get default currency from user context or fallback
export const getDefaultCurrency = (userCurrency?: string): string => {
  return userCurrency || DEFAULT_CURRENCY;
};

// Validate currency code
export const isValidCurrencyCode = (code: string): boolean => {
  return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
};

// Get popular currencies
export const getPopularCurrencies = (): Currency[] => {
  return SUPPORTED_CURRENCIES.filter(currency => 
    POPULAR_CURRENCIES.includes(currency.code)
  );
};

// Search currencies by name or code
export const searchCurrencies = (query: string): Currency[] => {
  const searchTerm = query.toLowerCase();
  return SUPPORTED_CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm) ||
    currency.name.toLowerCase().includes(searchTerm)
  );
};