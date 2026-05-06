"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
import {
  Category,
  Subcategory,
} from "@/services/online-services/frontendCategoryService";
import { generateCategoryUrl, generateSubcategoryUrl } from "@/lib/slugify";
import { useCurrency } from "@/hooks/useCurrency";

// Price range presets
const getPriceRanges = (currencySymbol: string) => [
  { label: `Under ${currencySymbol}100`, min: 0, max: 100 },
  { label: `${currencySymbol}100 - ${currencySymbol}500`, min: 100, max: 500 },
  {
    label: `${currencySymbol}500 - ${currencySymbol}1000`,
    min: 500,
    max: 1000,
  },
  {
    label: `${currencySymbol}1000 - ${currencySymbol}2000`,
    min: 1000,
    max: 2000,
  },
  { label: `Above ${currencySymbol}2000`, min: 2000, max: undefined },
];

export const PRICE_RANGES = getPriceRanges("₹"); // Fallback for export

// Badge options - Clean professional style (like BigBasket, JioMart, Zepto)
// Static badges - always available (no sortOrder, will use dynamic sorting from API)
export const STATIC_BADGE_OPTIONS: BadgeOption[] = [
  { value: 'all', label: 'All Products' },
  { value: 'combo', label: 'Combo Products' },
  { value: 'New Arrival', label: 'New Arrivals' },
  { value: 'Bestseller', label: 'Bestsellers' },
  { value: 'Trending', label: 'Trending' },
  { value: 'Hot Deal', label: 'Hot Deals' },
  { value: 'Limited Stock', label: 'Limited Stock' },
  { value: 'Sale', label: 'On Sale' },
];

// Badge option type
export interface BadgeOption {
  value: string;
  label: string;
  sortOrder?: number;
}

// For backward compatibility
export const BADGE_OPTIONS = STATIC_BADGE_OPTIONS;

export interface ProductFiltersProps {
  // Category Logic
  categories: Category[];
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | { id: string; name: string } | null;
  categoryMode?: "select" | "link";
  onSelectCategory?: (category: Category | null) => void;
  onSelectSubcategory?: (
    subcategory: Subcategory | { id: string; name: string } | null
  ) => void;

  // Brand Logic
  availableBrands: string[];
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;

  // Price Logic
  selectedPriceRange: { min?: number; max?: number } | null;
  onPriceRangeSelect: (range: { min?: number; max?: number } | null) => void;
  customMinPrice: string;
  customMaxPrice: string;
  setCustomMinPrice: (val: string) => void;
  setCustomMaxPrice: (val: string) => void;
  onCustomPriceApply: () => void;

  // Badge Logic (new)
  selectedBadge?: string;
  onBadgeSelect?: (badge: string) => void;
  badgeOptions?: BadgeOption[]; // Dynamic badge options (static + custom)

  // General
  activeFilterCount: number;
  onClearAll: () => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  selectedSubcategory,
  categoryMode = "select",
  onSelectCategory,
  onSelectSubcategory,
  availableBrands,
  selectedBrands,
  onBrandToggle,
  selectedPriceRange,
  onPriceRangeSelect,
  customMinPrice,
  customMaxPrice,
  setCustomMinPrice,
  setCustomMaxPrice,
  onCustomPriceApply,
  selectedBadge = 'all',
  onBadgeSelect,
  badgeOptions,
  activeFilterCount,
  onClearAll,
}: ProductFiltersProps) {
  const currencySymbol = useCurrency();
  const priceRanges = getPriceRanges(currencySymbol);
  
  // Use provided badge options or fall back to static options
  const displayBadgeOptions = badgeOptions || STATIC_BADGE_OPTIONS;
  
  const [expandedSections, setExpandedSections] = useState({
    badges: true,
    categories: true,
    brands: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Active Filters ({activeFilterCount})
            </span>
            <button
              onClick={onClearAll}
              className="text-xs text-[#e63946] hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Badge Chip */}
            {selectedBadge && selectedBadge !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#e63946] text-xs rounded-full">
                {displayBadgeOptions.find(b => b.value === selectedBadge)?.label || selectedBadge}
                <button
                  onClick={() => onBadgeSelect?.('all')}
                  className="hover:bg-red-100 rounded-full p-0.5"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}

            {/* Category Chips */}
            {categoryMode === "select" && selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#e63946] text-xs rounded-full">
                {selectedCategory.name}
                <button
                  onClick={() => onSelectCategory?.(null)}
                  className="hover:bg-red-100 rounded-full p-0.5"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {categoryMode === "select" && selectedSubcategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#e63946] text-xs rounded-full">
                {selectedSubcategory.name}
                <button
                  onClick={() => onSelectSubcategory?.(null)}
                  className="hover:bg-red-100 rounded-full p-0.5"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}

            {/* Brand Chips */}
            {selectedBrands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#e63946] text-xs rounded-full"
              >
                {brand}
                <button
                  onClick={() => onBrandToggle(brand)}
                  className="hover:bg-red-100 rounded-full p-0.5"
                >
                  <IconX size={12} />
                </button>
              </span>
            ))}

            {selectedPriceRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#e63946] text-xs rounded-full">
                {priceRanges.find(
                  (r) =>
                    r.min === selectedPriceRange.min &&
                    r.max === selectedPriceRange.max
                )?.label ||
                  `${currencySymbol}${
                    selectedPriceRange.min ?? "0"
                  } - ${currencySymbol}${selectedPriceRange.max ?? "∞"}`}
                <button
                  onClick={() => {
                    onPriceRangeSelect(null);
                    setCustomMinPrice("");
                    setCustomMaxPrice("");
                  }}
                  className="hover:bg-red-100 rounded-full p-0.5"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-semibold text-gray-800">Categories</span>
          {expandedSections.categories ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          )}
        </button>
        {expandedSections.categories && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {categoryMode === "select" && (
              <button
                onClick={() => onSelectCategory?.(null)}
                className={`w-full text-left block px-3 py-2 rounded text-sm ${
                  !selectedCategory
                    ? "bg-[#e63946] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                All Categories
              </button>
            )}

            {categories.map((cat) => (
              <div key={cat.id}>
                {categoryMode === "select" ? (
                  <button
                    onClick={() => onSelectCategory?.(cat)}
                    className={`w-full text-left block px-3 py-2 rounded text-sm ${
                      selectedCategory?.id === cat.id && !selectedSubcategory
                        ? "bg-[#e63946] text-white"
                        : selectedCategory?.id === cat.id
                        ? "bg-red-50 text-[#e63946] font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ) : (
                  <Link
                    href={generateCategoryUrl(cat)}
                    className={`block px-3 py-2 rounded text-sm ${
                      cat.id === selectedCategory?.id && !selectedSubcategory
                        ? "bg-[#e63946] text-white"
                        : cat.id === selectedCategory?.id
                        ? "bg-red-50 text-[#e63946] font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </Link>
                )}

                {/* Subcategories */}
                {selectedCategory?.id === cat.id &&
                  cat.subcategories &&
                  cat.subcategories.length > 0 && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                      {cat.subcategories.map((sub) =>
                        categoryMode === "select" ? (
                          <button
                            key={sub.id}
                            onClick={() => onSelectSubcategory?.(sub)}
                            className={`w-full text-left block px-2 py-1.5 rounded text-sm ${
                              selectedSubcategory?.id === sub.id
                                ? "bg-[#e63946] text-white"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ) : (
                          <Link
                            key={sub.id}
                            href={generateSubcategoryUrl(cat, sub)}
                            className={`block px-2 py-1.5 rounded text-sm ${
                              selectedSubcategory?.id === sub.id
                                ? "bg-[#e63946] text-white"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        )
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SHOP BY Type Section - Clean Professional Style */}
      {onBadgeSelect && (
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("badges")}
            className="flex items-center justify-between w-full py-2"
          >
            <span className="font-semibold text-gray-800">Shop By</span>
            {expandedSections.badges ? (
              <IconChevronUp size={18} />
            ) : (
              <IconChevronDown size={18} />
            )}
          </button>
          {expandedSections.badges && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {displayBadgeOptions
                .sort((a, b) => {
                  // Sort by sortOrder if available, otherwise keep original order
                  const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
                  const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
                  return orderA - orderB;
                })
                .map((badge) => (
                  <label
                    key={badge.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    <input
                      type="radio"
                      name="badgeFilter"
                      checked={selectedBadge === badge.value}
                      onChange={() => onBadgeSelect(badge.value)}
                      className="w-4 h-4 text-[#e63946] border-gray-300 focus:ring-[#e63946]"
                    />
                    <span className="text-sm text-gray-700">{badge.label}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Brands Section */}
      {availableBrands.length > 0 && (
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("brands")}
            className="flex items-center justify-between w-full py-2"
          >
            <span className="font-semibold text-gray-800">Brands</span>
            {expandedSections.brands ? (
              <IconChevronUp size={18} />
            ) : (
              <IconChevronDown size={18} />
            )}
          </button>
          {expandedSections.brands && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {availableBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => onBrandToggle(brand)}
                    className="w-4 h-4 text-[#e63946] border-gray-300 rounded focus:ring-[#e63946]"
                  />
                  <span className="text-sm text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Range Section */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-semibold text-gray-800">Price Range</span>
          {expandedSections.price ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-2 space-y-2">
            {/* Preset ranges */}
            {priceRanges.map((range, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={
                    selectedPriceRange?.min === range.min &&
                    selectedPriceRange?.max === range.max &&
                    !customMinPrice &&
                    !customMaxPrice
                  }
                  onChange={() =>
                    onPriceRangeSelect({ min: range.min, max: range.max })
                  }
                  className="w-4 h-4 text-[#e63946] border-gray-300 focus:ring-[#e63946]"
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}

            {/* Custom range */}
            <div className="pt-3 border-t mt-3">
              <p className="text-xs text-gray-500 mb-2">Custom Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={customMinPrice}
                  onChange={(e) => {
                    setCustomMinPrice(e.target.value);
                  }}
                  className="w-20 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={customMaxPrice}
                  onChange={(e) => {
                    setCustomMaxPrice(e.target.value);
                  }}
                  className="w-20 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                />
                <button
                  onClick={onCustomPriceApply}
                  className="px-3 py-1.5 bg-[#e63946] text-white text-sm rounded hover:bg-[#d62839]"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
