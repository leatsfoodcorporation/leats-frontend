"use client";

import {
  IconMinus,
  IconPlus,
  IconX,
  IconShoppingCart,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useCart } from "@/context/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { generateProductSlug } from "@/lib/slugify";
import { formatSmartUOMDisplay, convertUOMValue } from "@/lib/uom-constants";
import { getActiveDeliveryCharges, type DeliveryChargeRule } from "@/services/deliveryChargeService";
import { calculateDeliveryFee } from "@/lib/delivery-charge-utils";

/**
 * Calculate maximum units available for a cart item (UOM-aware)
 * Backend stores variantStockQuantity in variant UOM (after conversion)
 * We just need to divide by variantUomValue to get max units
 * 
 * UPDATE: Now accepts all items to calculate shared stock usage
 * For combo products, maxStock is already calculated by backend based on component availability
 */
const calculateMaxUnits = (
  targetItem: {
    inventoryProductId: string;
    maxStock: number;
    variantUom?: string;
    variantUomValue?: number;
    selectedCuttingStyle?: string;
    variantIndex: number;
    isComboProduct?: boolean;
    displayName?: string;
    variantName?: string;
    comboItems?: Array<{
      inventoryProductId?: string;
      variantUom?: string;
      variantUomValue?: number;
      quantity?: number;
    }>;
  },
  allItems: Array<{
    inventoryProductId: string;
    quantity: number;
    variantUom?: string;
    variantUomValue?: number;
    selectedCuttingStyle?: string;
    variantIndex: number;
    isComboProduct?: boolean;
    maxStock: number;
    displayName?: string;
    variantName?: string;
    comboItems?: Array<{
      inventoryProductId?: string;
      variantUom?: string;
      variantUomValue?: number;
      quantity?: number;
    }>;
  }>
): number => {
  // ✅ For combo products, backend already calculated maxStock based on component availability
  // We just need to return it directly - no need to recalculate on frontend
  if (targetItem.isComboProduct) {
    console.log('🔍 Combo product - using backend calculated maxStock:', {
      comboName: targetItem.displayName || targetItem.variantName,
      maxStock: targetItem.maxStock
    });
    return targetItem.maxStock;
  }
  
  // For regular products, calculate based on shared inventory
  // 1. Calculate how much stock is used by OTHER items sharing the same inventory
  const otherItems = allItems.filter(
    item => 
      item.inventoryProductId === targetItem.inventoryProductId &&
      // Exclude THIS item instance from the consumption calculation
      !(
        item.variantIndex === targetItem.variantIndex && 
        (item.selectedCuttingStyle || '') === (targetItem.selectedCuttingStyle || '')
      )
  );

  let stockAllocatedToOthers = 0;

  // Check regular products with same inventoryProductId
  for (const item of otherItems) {
      let consumption = 0;
      if (item.variantUom && item.variantUomValue) {
          const consumptionInItemUom = item.quantity * item.variantUomValue;
          
          // Use dynamic UOM conversion
          if (targetItem.variantUom && item.variantUom !== targetItem.variantUom) {
             const converted = convertUOMValue(consumptionInItemUom, item.variantUom, targetItem.variantUom);
             consumption = converted !== null ? converted : consumptionInItemUom;
          } else {
             consumption = consumptionInItemUom;
          }
      } else {
        consumption = item.quantity; // Unit based
      }
      stockAllocatedToOthers += consumption;
  }
  
  // ✅ Also check combo products that use this inventory as a component
  const comboItems = allItems.filter(item => item.isComboProduct && item.comboItems);
  for (const comboItem of comboItems) {
    if (!comboItem.comboItems) continue;
    
    for (const component of comboItem.comboItems) {
      if (component.inventoryProductId === targetItem.inventoryProductId) {
        // This combo uses our inventory as a component
        const componentQtyPerCombo = component.quantity || 1;
        const componentUomValue = component.variantUomValue || 1;
        const componentUom = component.variantUom || targetItem.variantUom;
        const comboQuantity = comboItem.quantity;
        
        // Calculate total consumption from this combo
        const totalConsumption = comboQuantity * componentQtyPerCombo * componentUomValue;
        
        // Convert to target item's UOM if needed
        let consumption = totalConsumption;
        if (targetItem.variantUom && componentUom && componentUom !== targetItem.variantUom) {
          const converted = convertUOMValue(totalConsumption, componentUom, targetItem.variantUom);
          consumption = converted !== null ? converted : totalConsumption;
        }
        
        stockAllocatedToOthers += consumption;
        
        console.log('🔍 Combo consuming inventory:', {
          comboName: comboItem.displayName,
          targetInventory: targetItem.inventoryProductId,
          comboQty: comboQuantity,
          componentQty: componentQtyPerCombo,
          componentUomValue,
          componentUom,
          totalConsumption,
          converted: consumption
        });
      }
    }
  }

  let remainingStock = targetItem.maxStock;
  
  // If using UOM
  if (targetItem.variantUom && targetItem.variantUomValue && targetItem.variantUomValue > 0) {
      remainingStock = targetItem.maxStock - stockAllocatedToOthers;
      return Math.max(0, Math.floor(remainingStock / targetItem.variantUomValue));
  }
  
  // If simple unit based
  remainingStock = targetItem.maxStock - stockAllocatedToOthers;
  return Math.max(0, remainingStock);
};

export default function CartPageClient() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalSavings,
    totalItems,
    isLoading,
    isInitialized,
  } = useCart();
  const [cartErrors, setCartErrors] = useState<Record<string, string>>({});

  const handleUpdateQuantity = async (productId: string, inventoryProductId: string, variantIndex: number, newQuantity: number, selectedCuttingStyle?: string) => {
    // Clear previous error for this item
    const key = `${inventoryProductId}-${variantIndex}-${selectedCuttingStyle || 'default'}`;
    setCartErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    // ✅ Call updateQuantity which already does optimistic update
    const error = await updateQuantity(productId, inventoryProductId, variantIndex, newQuantity, selectedCuttingStyle);
    
    if (error) {
       setCartErrors(prev => ({ ...prev, [key]: error }));
    }
    // ✅ No need to call refreshCart here - updateQuantity already handles it with optimistic updates
    // The cart context automatically updates the UI without showing loading states
  };
  const currencySymbol = useCurrency();
  const [deliveryChargeRules, setDeliveryChargeRules] = useState<DeliveryChargeRule[]>([]);

  // Fetch delivery charge rules on mount
  useEffect(() => {
    const fetchDeliveryCharges = async () => {
      try {
        const rules = await getActiveDeliveryCharges();
        setDeliveryChargeRules(rules);
      } catch (error) {
        console.error("Error fetching delivery charges:", error);
      }
    };
    fetchDeliveryCharges();
  }, []);

  // Calculate delivery fee using utility function
  const { finalDeliveryFee, freeDeliveryThreshold, appliedRule, usingProductShipping } = 
    calculateDeliveryFee(totalPrice, deliveryChargeRules, items);

  console.log('🚚 Delivery Calculation:', {
    cartTotal: totalPrice,
    rulesCount: deliveryChargeRules.length,
    appliedRule: appliedRule ? {
      threshold: appliedRule.minOrderValue,
      charge: appliedRule.chargeAmount,
    } : 'none',
    finalFee: finalDeliveryFee,
    usingProductShipping,
    productShippingCharges: items.map(item => ({
      name: item.displayName,
      freeShipping: item.freeShipping,
      shippingCharge: item.shippingCharge,
    })),
  });
  
  const total = totalPrice + finalDeliveryFee;

  // Check for stock issues (UOM-aware)
  // This includes: out of stock items, items exceeding available stock, and combo products with insufficient component stock
  const hasStockIssues = items.some(item => {
    const maxUnits = calculateMaxUnits(item, items);
    // Check if item is out of stock, exceeds available units, or has zero availability
    const hasIssue = item.quantity > maxUnits || maxUnits === 0;
    
    // Debug logging
    if (hasIssue) {
      console.log('Stock issue detected:', {
        product: item.displayName || item.variantName,
        quantity: item.quantity,
        maxUnits,
        maxStock: item.maxStock,
        isCombo: item.isComboProduct,
        hasIssue
      });
    }
    
    return hasIssue;
  });
  
  // Debug: Log checkout button state
  useEffect(() => {
    console.log('🛒 Checkout button state:', {
      hasStockIssues,
      itemCount: items.length,
      items: items.map(item => ({
        name: item.displayName || item.variantName,
        quantity: item.quantity,
        maxStock: item.maxStock,
        maxUnits: calculateMaxUnits(item, items),
        isCombo: item.isComboProduct
      }))
    });
  }, [hasStockIssues, items]);
  
  const outOfStockItems = items.filter(item => {
    const maxUnits = calculateMaxUnits(item, items);
    return maxUnits === 0;
  });
  
  const overStockItems = items.filter(item => {
    const maxUnits = calculateMaxUnits(item, items);
    return item.quantity > maxUnits && maxUnits > 0;
  });
  
  // ✅ DISABLED: Auto-remove out of stock items after a delay
  // Users should manually remove items or reduce quantities to fix stock issues
  // useEffect(() => {
  //   if (outOfStockItems.length > 0 && isInitialized && !isLoading) {
  //     const timer = setTimeout(() => {
  //       outOfStockItems.forEach(item => {
  //         console.log('Auto-removing out of stock item:', item.displayName);
  //         removeFromCart(item.productId, item.inventoryProductId, item.variantIndex, item.selectedCuttingStyle);
  //       });
  //       toast.info(`Removed ${outOfStockItems.length} out of stock item(s) from cart`);
  //     }, 3000); // Wait 3 seconds before auto-removing
  //     
  //     return () => clearTimeout(timer);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [outOfStockItems.length, isInitialized, isLoading]);

  // Helper function to generate proper product URL for cart items
  const generateCartItemUrl = (item: {
    productId: string;
    inventoryProductId: string;
    brand: string;
    displayName?: string;
    variantName: string;
  }) => {
    const slug = generateProductSlug({
      brand: item.brand,
      shortDescription: item.displayName || item.variantName,
    });
    const variantParam = item.inventoryProductId ? `?variant=${item.inventoryProductId}` : '';
    return `/products/${slug}/${item.productId}${variantParam}`;
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-4 sm:mb-8">
            <Skeleton className="h-4 w-12 bg-gray-200" />
            <span className="text-gray-300">/</span>
            <Skeleton className="h-4 w-24 bg-gray-200" />
          </div>

          {/* Page Header Skeleton */}
          <div className="mb-4 sm:mb-8">
            <Skeleton className="h-8 w-48 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-64 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Table Header Skeleton - Desktop */}
                <div className="hidden sm:block bg-gray-50 px-6 py-4 border-b">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mx-auto bg-gray-200" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mx-auto bg-gray-200" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mx-auto bg-gray-200" />
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 sm:p-6">
                      <div className="flex gap-4">
                        <Skeleton className="w-[80px] h-[80px] rounded-lg flex-shrink-0 bg-gray-200" />
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2 w-full">
                              <Skeleton className="h-4 w-1/3 bg-gray-200" />
                              <Skeleton className="h-5 w-3/4 bg-gray-200" />
                              <Skeleton className="h-3 w-1/4 bg-gray-200" />
                            </div>
                            <Skeleton className="h-6 w-6 rounded bg-gray-200" />
                          </div>
                          <div className="hidden sm:flex items-center justify-between mt-4">
                            <Skeleton className="h-5 w-20 bg-gray-200" />
                            <Skeleton className="h-8 w-24 rounded bg-gray-200" />
                            <Skeleton className="h-5 w-16 bg-gray-200" />
                          </div>
                          {/* Mobile skeleton parts */}
                          <div className="sm:hidden mt-3 flex justify-between items-center">
                            <Skeleton className="h-8 w-24 rounded bg-gray-200" />
                            <Skeleton className="h-5 w-16 bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-24 space-y-4">
                <Skeleton className="h-6 w-32 mb-4 bg-gray-200" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                    <Skeleton className="h-4 w-16 bg-gray-200" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                    <Skeleton className="h-4 w-16 bg-gray-200" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                    <Skeleton className="h-4 w-16 bg-gray-200" />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16 bg-gray-200" />
                    <Skeleton className="h-6 w-24 bg-gray-200" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-md mt-4 bg-gray-200" />
                <Skeleton className="h-12 w-full rounded-md bg-gray-200" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 sm:mb-8">
          <Link href="/" className="hover:text-[#e63946]">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900">Shopping Cart</span>
        </nav>

        {/* Page Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Shopping Cart
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            There are {totalItems} products in your cart
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <IconShoppingCart size={32} className="text-gray-400 sm:hidden" />
              <IconShoppingCart
                size={48}
                className="text-gray-400 hidden sm:block"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
              Looks like you have not added any items to your cart yet.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#e63946] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md hover:bg-[#c1121f] transition-colors text-sm sm:text-base"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Table Header - Desktop Only */}
                <div className="hidden sm:block bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Total</div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="divide-y">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.inventoryProductId}-${item.variantIndex}-${item.selectedCuttingStyle || 'none'}`}
                      className={`p-3 sm:p-6 ${item.maxStock === 0 ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            {item.variantImage && item.variantImage.trim() !== '' ? (
                              <Image
                                src={item.variantImage}
                                alt={item.displayName}
                                width={80}
                                height={80}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500">
                                  {item.brand}
                                </p>
                                <Link href={generateCartItemUrl(item)}>
                                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-[#e63946]">
                                    {item.displayName || item.variantName}
                                    {item.variantUom && item.variantUomValue && (
                                      <span className="text-muted-foreground ml-1">
                                        ({item.variantUomValue}{item.variantUom})
                                      </span>
                                    )}
                                  </h3>
                                </Link>
                                {item.selectedCuttingStyle && (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    <span>✂</span> {item.selectedCuttingStyle}
                                  </span>
                                )}
                                {item.isComboProduct && item.comboItems && item.comboItems.length > 0 && (
                                  <div className="mt-1 space-y-0.5 pl-2 border-l border-[#e63946]/20">
                                    {item.comboItems.map((ci, idx: number) => (
                                      <p key={idx} className="text-[10px] text-gray-500">
                                        • {ci.quantity}x {ci.productName || ci.variantName}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {item.maxStock === 0 && (
                                  <p className="text-xs text-red-600 mt-1 font-semibold bg-red-50 px-2 py-1 rounded">
                                    {item.isComboProduct 
                                      ? '⚠️ Insufficient stock - reduce other items in cart' 
                                      : '❌ Out of Stock'}
                                  </p>
                                )}
                                {(() => {
                                  const maxUnits = calculateMaxUnits(item, items);
                                  if (item.quantity > maxUnits && maxUnits > 0) {
                                    // Calculate available stock in the item's UOM
                                    const availableInUom = item.variantUom && item.variantUomValue 
                                      ? maxUnits * item.variantUomValue 
                                      : maxUnits;
                                    const displayStock = item.variantUom 
                                      ? formatSmartUOMDisplay(availableInUom, item.variantUom)
                                      : `${maxUnits} unit${maxUnits !== 1 ? 's' : ''}`;
                                    
                                    return (
                                      <p className="text-xs text-red-600 mt-1 font-semibold bg-red-50 px-2 py-1 rounded">
                                        ⚠️ Only {displayStock} available - reduce quantity to proceed
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.productId,
                                    item.inventoryProductId,
                                    item.variantIndex,
                                    item.selectedCuttingStyle
                                  )
                                }
                                disabled={(() => {
                                  const maxUnits = calculateMaxUnits(item, items);
                                  return maxUnits === 0;
                                })()}
                                className={`p-1 flex-shrink-0 transition-colors ${
                                  (() => {
                                    const maxUnits = calculateMaxUnits(item, items);
                                    if (maxUnits === 0) {
                                      return 'text-gray-300 cursor-not-allowed opacity-50';
                                    }
                                    return 'text-gray-400 hover:text-red-500';
                                  })()
                                }`}
                              >
                                <IconX size={18} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.inventoryProductId,
                                      item.variantIndex,
                                      item.quantity - 1,
                                      item.selectedCuttingStyle
                                    )
                                  }
                                  disabled={item.maxStock === 0}
                                  className="p-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <IconMinus size={14} />
                                </button>
                                <span className="px-3 py-1 text-sm min-w-[32px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.inventoryProductId,
                                      item.variantIndex,
                                      item.quantity + 1,
                                      item.selectedCuttingStyle
                                    )
                                  }
                                  disabled={item.quantity >= calculateMaxUnits(item, items) || calculateMaxUnits(item, items) === 0}
                                  className="p-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <IconPlus size={14} />
                                </button>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-[#e63946]">
                                  {currencySymbol}
                                  {(
                                    item.variantSellingPrice * item.quantity
                                  ).toFixed(0)}
                                </span>
                                {item.variantMRP > item.variantSellingPrice && (
                                  <span className="block text-xs text-gray-400 line-through">
                                    {currencySymbol}
                                    {(item.variantMRP * item.quantity).toFixed(
                                      0
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        {/* Product Info */}
                        <div className="col-span-6 flex items-center gap-4">
                          <button
                            onClick={() =>
                              removeFromCart(
                                item.productId,
                                item.inventoryProductId,
                                item.variantIndex,
                                item.selectedCuttingStyle
                              )
                            }
                            disabled={(() => {
                              const maxUnits = calculateMaxUnits(item, items);
                              return maxUnits === 0;
                            })()}
                            className={`transition-colors ${
                              (() => {
                                const maxUnits = calculateMaxUnits(item, items);
                                if (maxUnits === 0) {
                                  return 'text-gray-300 cursor-not-allowed opacity-50 p-2';
                                }
                                return 'text-gray-400 hover:text-red-500';
                              })()
                            }`}
                          >
                            <IconX size={20} />
                          </button>
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            {item.variantImage && item.variantImage.trim() !== '' ? (
                              <Image
                                src={item.variantImage}
                                alt={item.shortDescription}
                                width={80}
                                height={80}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              {item.brand}
                            </p>
                            <Link href={generateCartItemUrl(item)}>
                              <h3 className="font-semibold text-gray-900 hover:text-[#e63946] transition-colors">
                                {item.displayName || item.variantName}
                                {item.variantUom && item.variantUomValue && (
                                  <span className="text-muted-foreground ml-1">
                                    ({item.variantUomValue}{item.variantUom})
                                  </span>
                                )}
                              </h3>
                            </Link>
                            {item.selectedCuttingStyle && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                <span>✂</span> {item.selectedCuttingStyle}
                              </span>
                            )}
                            {item.isComboProduct && item.comboItems && item.comboItems.length > 0 && (
                              <div className="mt-1 space-y-0.5 pl-2 border-l border-[#e63946]/20">
                                {item.comboItems.map((ci, idx: number) => (
                                  <p key={idx} className="text-[10px] text-gray-500">
                                    • {ci.quantity}x {ci.productName || ci.variantName}
                                  </p>
                                ))}
                              </div>
                            )}
                            {item.maxStock === 0 && (
                              <p className="text-xs text-red-600 mt-1 font-semibold bg-red-50 px-2 py-1 rounded">
                                {item.isComboProduct 
                                  ? '⚠️ Insufficient stock - reduce other items in cart' 
                                  : '❌ Out of Stock'}
                              </p>
                            )}
                            {(() => {
                              const maxUnits = calculateMaxUnits(item, items);
                              if (item.quantity > maxUnits && maxUnits > 0) {
                                // Calculate available stock in the item's UOM
                                const availableInUom = item.variantUom && item.variantUomValue 
                                  ? maxUnits * item.variantUomValue 
                                  : maxUnits;
                                const displayStock = item.variantUom 
                                  ? formatSmartUOMDisplay(availableInUom, item.variantUom)
                                  : `${maxUnits} unit${maxUnits !== 1 ? 's' : ''}`;
                                
                                return (
                                  <p className="text-xs text-red-600 mt-1 font-semibold bg-red-50 px-2 py-1 rounded">
                                    ⚠️ Only {displayStock} available - reduce quantity to proceed
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          {/* 🆕 Inline Error Message (User Request) */}
                          {cartErrors[`${item.inventoryProductId}-${item.variantIndex}-${item.selectedCuttingStyle || 'default'}`] && (
                            <div className="mt-1">
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                ⚠️ {cartErrors[`${item.inventoryProductId}-${item.variantIndex}-${item.selectedCuttingStyle || 'default'}`]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-center">
                          <span className="font-semibold text-gray-900">
                            {currencySymbol}
                            {item.variantSellingPrice.toFixed(0)}
                          </span>
                          {item.variantMRP > item.variantSellingPrice && (
                            <span className="block text-xs text-gray-400 line-through">
                              {currencySymbol}
                              {item.variantMRP.toFixed(0)}
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 flex justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productId,
                                    item.inventoryProductId,
                                    item.variantIndex,
                                    item.quantity - 1,
                                    item.selectedCuttingStyle
                                  )
                                }
                                disabled={item.maxStock === 0}
                                className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <IconMinus size={16} />
                              </button>
                              <span className="px-4 py-2 min-w-[40px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productId,
                                    item.inventoryProductId,
                                    item.variantIndex,
                                    item.quantity + 1,
                                    item.selectedCuttingStyle
                                  )
                                }
                                disabled={item.quantity >= calculateMaxUnits(item, items) || calculateMaxUnits(item, items) === 0}
                                className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <IconPlus size={16} />
                              </button>
                            </div>
                            {item.maxStock === 0 && (
                              <span className="text-xs text-red-600 font-medium">
                                {item.isComboProduct ? 'Insufficient stock' : 'Out of stock'}
                              </span>
                            )}
                            {item.quantity >= calculateMaxUnits(item, items) && calculateMaxUnits(item, items) > 0 && (
                              <span className="text-xs text-orange-600">
                                Max stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="col-span-2 text-center">
                          <span className="font-semibold text-[#e63946]">
                            {currencySymbol}
                            {(item.variantSellingPrice * item.quantity).toFixed(
                              0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Actions */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                  <Link
                    href="/products"
                    className="text-[#e63946] hover:underline font-medium text-sm sm:text-base"
                  >
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              {/* Stock Issues Warning */}
              {hasStockIssues && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-2">
                        Stock Issues Found
                      </h4>
                      <div className="text-xs text-red-700 space-y-1">
                        {outOfStockItems.length > 0 && (
                          <p>• {outOfStockItems.length} item(s) {outOfStockItems.some(i => i.isComboProduct) ? 'have insufficient stock' : 'are out of stock'}</p>
                        )}
                        {overStockItems.length > 0 && (
                          <p>• {overStockItems.length} item(s) exceed available stock</p>
                        )}
                        <p className="font-medium mt-2">
                          Please adjust quantities or remove items to proceed with checkout.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-24">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Order Summary
                </h3>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">
                      Subtotal ({totalItems} items)
                    </span>
                    <span className="font-semibold">
                      {currencySymbol}
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  {/* {totalSavings > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Discount</span>
                      <span className="font-semibold">
                        -{currencySymbol}
                        {totalSavings.toFixed(2)}
                      </span>
                    </div>
                  )} */}
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold">
                      {finalDeliveryFee === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `${currencySymbol}${finalDeliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-3 sm:pt-4">
                    <div className="flex justify-between">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#e63946]">
                        {currencySymbol}
                        {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Notice - Show when delivery fee applies */}
                {finalDeliveryFee > 0 && freeDeliveryThreshold > 0 && totalPrice < freeDeliveryThreshold && !usingProductShipping && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">
                          🎉 Almost there! Get FREE delivery
                        </p>
                        <p className="text-xs sm:text-sm text-yellow-800">
                          Add <span className="font-bold text-yellow-900">{currencySymbol}{(freeDeliveryThreshold - totalPrice).toFixed(2)}</span> more to your cart to qualify for free delivery!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Shipping Notice - Show when using product-level charges */}
                {usingProductShipping && finalDeliveryFee > 0 && freeDeliveryThreshold > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                          📦 Product shipping charges applied
                        </p>
                        <p className="text-xs sm:text-sm text-blue-800">
                          Add <span className="font-bold text-blue-900">{currencySymbol}{(freeDeliveryThreshold - totalPrice).toFixed(2)}</span> more to unlock free delivery on your entire order!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Free Delivery Success Message */}
                {finalDeliveryFee === 0 && freeDeliveryThreshold > 0 && totalPrice >= freeDeliveryThreshold && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-green-900 mb-1">
                          ✅ Congratulations! You&apos;ve unlocked FREE delivery
                        </p>
                        <p className="text-xs sm:text-sm text-green-800">
                          Your order qualifies for free delivery (minimum {currencySymbol}{freeDeliveryThreshold})
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings Badge */}
                {totalSavings > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 sm:p-4 mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-green-800 font-medium">
                      🎉 You are saving {currencySymbol}
                      {totalSavings.toFixed(2)} on this order!
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mb-3 sm:mb-4">
                  {hasStockIssues ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base shadow-sm flex items-center justify-center cursor-not-allowed"
                    >
                      Cannot Proceed - Stock Issues
                    </button>
                  ) : (
                    <Link
                      href="/checkout"
                      className="w-full bg-[#e63946] text-white py-2.5 sm:py-3 rounded-md hover:bg-[#c1121f] transition-colors font-semibold text-sm sm:text-base shadow-sm flex items-center justify-center"
                    >
                      Proceed to Checkout
                    </Link>
                  )}
                  <Link
                    href="/products"
                    className="w-full border-2 border-gray-300 text-gray-700 py-2.5 sm:py-3 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base flex items-center justify-center"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Payment Methods */}
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs text-gray-500 mb-2">We Accept</p>
                  <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      VISA
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      Mastercard
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      UPI
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      COD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
