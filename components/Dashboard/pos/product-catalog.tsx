"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "./pos-interface";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { formatSmartUOMDisplay } from "@/lib/uom-constants";

interface ProductCatalogProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product, variant?: any) => void;
}

interface OfflineProduct {
  id: string;
  itemName: string;
  purchasePrice: number;
  sellingPrice?: number;
  mrp?: number;
  quantity: number;
  category: string;
  uom: string;
  itemCode?: string;
  barcode?: string;
  brand?: string;
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;
  itemImage?: string;
  display: string;
  displayPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  discountType?: string;
  discountValue?: number;
  gstPercentage?: number;
}

export const ProductCatalog = React.forwardRef<
  { refreshProducts: () => Promise<void> },
  ProductCatalogProps
>(({ searchQuery, onSearchChange, onAddToCart }, ref) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");
  const [currency, setCurrency] = useState<string>("INR");

  // Fetch admin currency on mount
  useEffect(() => {
    const fetchAdminCurrency = async () => {
      try {
        const adminData = await authService.getCurrentAdmin();
        const adminCurrency = adminData.currency || "INR";
        const symbol = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: adminCurrency,
        })
          .formatToParts(0)
          .find((part) => part.type === "currency")?.value || "₹";
        
        setCurrency(adminCurrency);
        setCurrencySymbol(symbol);
      } catch (error) {
        console.error("Error fetching admin currency:", error);
      }
    };
    fetchAdminCurrency();
  }, []);

  // Fetch products from offline service
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory]);

  // Auto-add logic for barcode scans
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      // Find products that have an exact barcode match (global or variant)
      const exactMatches = products.filter(p => 
        (p.barcode && p.barcode === searchQuery) || 
        (p.uomVariants && p.uomVariants.some((v: any) => v.barcode === searchQuery))
      );

      if (exactMatches.length === 1) {
        const product = exactMatches[0];
        const variantMatch = product.uomVariants?.find((v: any) => v.barcode === searchQuery);
        
        // Small delay to ensure the search input has finished receiving data
        const timer = setTimeout(() => {
          onAddToCart(product, variantMatch);
          onSearchChange(""); // Reset search bar
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }
  }, [searchQuery, products]);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Expose refreshProducts method to parent via ref
  React.useImperativeHandle(ref, () => ({
    refreshProducts: async () => {
      await fetchProducts(true); // Silent refresh - no loading spinner
    },
  }));

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/inventory/categories?isActive=true"
      );
      if (response.data.success) {
        const categoryNames = response.data.data.map(
          (cat: { name: string }) => cat.name
        );
        setCategories(["all", ...categoryNames]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(["all"]);
    }
  };

  const fetchProducts = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const params: any = {};
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const response = await axiosInstance.get("/api/pos/products", {
        params,
      });

      if (response.data.success) {
        // Transform offline products to POS product format
        // Only include products with display = "active"
        const transformedProducts: Product[] = response.data.data
          .filter((p: OfflineProduct) => p.display === "active")
          .map((p: OfflineProduct) => ({
            id: p.id,
            name: p.itemName,
            price: p.displayPrice || p.sellingPrice || p.purchasePrice, // Use displayPrice (after discount)
            stock: p.quantity,
            category: p.category,
            sku: p.itemCode || "",
            barcode: p.barcode,
            brand: p.brand,
            batchNo: p.batchNo,
            mfgDate: p.mfgDate,
            expiryDate: p.expiryDate,
            mrp: p.mrp,
            sellingPrice: p.sellingPrice,
            originalPrice: p.originalPrice, // Price before discount
            discountAmount: p.discountAmount,
            image: p.itemImage, // Backend now returns full URL
            gstPercentage: p.gstPercentage || 0,
            // Multi-UOM fields
            uom: p.uom,
            baseUom: (p as any).baseUom,
            availableUoms: (p as any).availableUoms || [],
            uomLocked: (p as any).uomLocked || false,
            variantUomValue: (p as any).variantUomValue,
            uomVariants: (p as any).uomVariants || [],
          }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      if (!silent) {
        toast.error("Failed to load products", {
          description: "Unable to fetch product catalog. Please try again.",
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.uomVariants || []).some((v: any) => v.barcode?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search by name, SKU, barcode, or brand..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-700 dark:text-gray-300">
            Loading products...
          </span>
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No products found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
});

ProductCatalog.displayName = "ProductCatalog";

interface ProductCardProps {
  product: Product;
  currency: string;
  onAddToCart: (product: Product, variant?: any) => void;
}

const ProductCard = ({ product, currency, onAddToCart }: ProductCardProps) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<string>("default");

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const hasVariants = product.uomVariants && product.uomVariants.length > 0;
  const selectedVariant = selectedVariantIndex === "default" 
    ? null 
    : product.uomVariants?.[parseInt(selectedVariantIndex)];

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayUom = selectedVariant ? selectedVariant.uom : (product.baseUom || product.uom || 'pcs');
  const displayStock = product.stock;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all hover:shadow-lg flex flex-col ${
        displayStock <= 0
          ? "opacity-50 border-gray-200 dark:border-gray-700"
          : "border-gray-200 dark:border-gray-700 hover:border-primary"
      }`}
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
        {product.image && product.image.trim() !== '' ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            priority={false}
            quality={75}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>

      {/* Product Info */}
      <div className="text-left flex-grow">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex flex-col gap-1 mb-3">
          {product.brand && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Brand: {product.brand}
            </p>
          )}
          {product.sku && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SKU: {product.sku}
            </p>
          )}
        </div>

        {/* UOM Variant Selector */}
        {hasVariants && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <Select
              value={selectedVariantIndex}
              onValueChange={setSelectedVariantIndex}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select UOM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" className="text-xs">
                  Default ({product.baseUom || product.uom})
                </SelectItem>
                {product.uomVariants?.map((variant, idx) => (
                  <SelectItem key={idx} value={idx.toString()} className="text-xs">
                    {variant.name || variant.uom} ({formatCurrency(variant.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1 mb-3">
          {product.originalPrice && product.originalPrice !== product.price && selectedVariantIndex === "default" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            </div>
          )}
          <span className="text-lg font-bold text-primary">
            {formatCurrency(displayPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <Badge
            variant={displayStock > 10 ? "default" : "destructive"}
            className="text-[10px] px-1.5 py-0 h-5"
          >
            {displayStock > 0
              ? `${formatSmartUOMDisplay(displayStock, product.baseUom || product.uom || 'pcs')} in stock`
              : "Out of stock"}
          </Badge>

          <button
            onClick={() => onAddToCart(product, selectedVariant)}
            disabled={displayStock <= 0}
            className="p-1 px-3 bg-primary text-white rounded-md text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
