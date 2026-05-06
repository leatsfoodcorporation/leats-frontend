"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { 
  SUPPORTED_CURRENCIES, 
  getPopularCurrencies, 
  searchCurrencies,
  Currency 
} from "@/lib/currency";

interface CurrencySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showSearch?: boolean;
  showPopular?: boolean;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select currency",
  disabled = false,
  showSearch = true,
  showPopular = true,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Get currencies to display
  const getCurrenciesToDisplay = (): Currency[] => {
    if (searchQuery.trim()) {
      return searchCurrencies(searchQuery);
    }
    return SUPPORTED_CURRENCIES;
  };

  const currenciesToDisplay = getCurrenciesToDisplay();
  const popularCurrencies = showPopular ? getPopularCurrencies() : [];

  const renderCurrencyItem = (currency: Currency) => (
    <SelectItem key={currency.code} value={currency.code}>
      <div className="flex items-center gap-2 w-full">
        <span className="text-lg">{currency.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{currency.code}</span>
            <span className="text-sm text-muted-foreground">
              {currency.symbol}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {currency.name}
          </div>
        </div>
      </div>
    </SelectItem>
  );

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              {(() => {
                const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === value);
                return selectedCurrency ? (
                  <>
                    <span className="text-sm">{selectedCurrency.flag}</span>
                    <span className="font-medium">{selectedCurrency.code}</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedCurrency.symbol}
                    </span>
                  </>
                ) : (
                  <span>{value}</span>
                );
              })()}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {showSearch && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}
        
        {showPopular && !searchQuery && popularCurrencies.length > 0 && (
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            </div>
            {popularCurrencies.map(renderCurrencyItem)}
            <div className="border-t my-2" />
          </div>
        )}
        
        <div className="max-h-[200px] overflow-y-auto">
          {currenciesToDisplay.length > 0 ? (
            currenciesToDisplay
              .filter(currency => 
                !showPopular || 
                searchQuery || 
                !popularCurrencies.some(p => p.code === currency.code)
              )
              .map(renderCurrencyItem)
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No currencies found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};