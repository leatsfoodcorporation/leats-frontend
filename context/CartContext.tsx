'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Product } from '@/services/online-services/frontendProductService';
import * as cartService from '@/services/online-services/frontendCartService';
import type { CartItemResponse } from '@/services/online-services/frontendCartService';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';
import { convertUOMValue } from '@/lib/uom-constants';


export interface CartItem {
  productId: string;
  inventoryProductId: string;
  variantIndex: number;
  quantity: number;
  maxStock: number; // Available stock for validation (in variant UOM if applicable)
  // Cached product data for display
  shortDescription: string;
  brand: string;
  category: string; // Product category name
  categoryId?: string; // Product category ID
  variantName: string;
  displayName: string; // User-friendly display name
  variantSellingPrice: number;
  variantMRP: number;
  variantImage: string;
  selectedCuttingStyle?: string;
  // 🆕 Multi-UOM fields for stock calculation
  variantUom?: string;
  variantUomValue?: number;
  // 🆕 Shipping fields for delivery cost calculation
  freeShipping?: boolean;
  shippingCharge?: number;
  // 🆕 Combo fields
  isComboProduct?: boolean;
  comboItems?: Array<{
    productId?: string;
    variantIndex?: number;
    quantity?: number;
    productName?: string;
    variantName?: string;
    inventoryProductId?: string;
    variantUom?: string;
    variantUomValue?: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variantIndex: number, cuttingStyle?: string) => Promise<void>;
  removeFromCart: (productId: string, inventoryProductId: string, variantIndex: number, selectedCuttingStyle?: string) => Promise<void>;
  updateQuantity: (productId: string, inventoryProductId: string, variantIndex: number, quantity: number, selectedCuttingStyle?: string) => Promise<string | null>;
  getItemQuantity: (productId: string, inventoryProductId: string, variantIndex: number, selectedCuttingStyle?: string) => number;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>; // ✅ NEW: Manual refresh function
  totalItems: number;
  totalPrice: number;
  totalSavings: number;
  isLoading: boolean;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

  const loadCart = useCallback(async (silent: boolean = false) => {
    if (!isAuthenticated || !user?.id || user?.role !== 'user') return;

    try {
      // Only show loading skeleton on initial load, not on silent refreshes
      if (!silent) {
        setIsLoading(true);
      }
      const response = await cartService.getCart(user.id);
      
      const validatedItems = response.data.map((item: CartItemResponse) => ({
        productId: item.productId,
        inventoryProductId: item.inventoryProductId,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
        maxStock: item.maxStock,
        shortDescription: item.shortDescription,
        brand: item.brand,
        category: item.category,
        categoryId: item.categoryId,
        variantName: item.variantName,
        displayName: item.displayName || item.variantName,
        variantSellingPrice: item.variantSellingPrice,
        variantMRP: item.variantMRP,
        variantImage: item.variantImage,
        selectedCuttingStyle: item.selectedCuttingStyle,
        // 🆕 Include UOM fields from backend response
        variantUom: (item as CartItemResponse & { variantUom?: string }).variantUom,
        variantUomValue: (item as CartItemResponse & { variantUomValue?: number }).variantUomValue,
        // 🆕 Include shipping fields from backend response
        freeShipping: (item as CartItemResponse & { freeShipping?: boolean }).freeShipping,
        shippingCharge: (item as CartItemResponse & { shippingCharge?: number }).shippingCharge,
        // 🆕 Include combo fields from backend response
        isComboProduct: item.isComboProduct,
        comboItems: item.comboItems,
      }));
      
      setItems(validatedItems);
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      
      if (error && typeof error === 'object' && ('code' in error || 'message' in error)) {
        const err = error as { code?: string; message?: string };
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          toast.error('Unable to load cart. Please check your connection.');
        }
      }
    } finally {
      // Only update loading state if not silent
      if (!silent) {
        setIsLoading(false);
      }
      setIsInitialized(true);
    }
  }, [isAuthenticated, user?.id, user?.role]);

  // Load cart when user logs in
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user?.id && user?.role === 'user') {
      loadCart();
    } else {
      // Clear cart when user logs out or is admin
      setItems([]);
      setIsInitialized(true);
    }
  }, [user?.id, user?.role, isAuthenticated, loadCart, authLoading]);

  // Add cart validation on mount - check if cart is empty but should have items
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || user?.role !== 'user') return;
    
    // If cart is empty after loading, it might have been cleared
    // This is normal, but we log it for debugging
    if (items.length === 0) {
      console.log('Cart is empty after loading');
    }
  }, [isInitialized, items.length, isAuthenticated, user?.role]);

  const addToCart = async (product: Product, variantIndex: number, cuttingStyle?: string) => {
    // Check if user is authenticated and is a customer (not admin)
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to add items to your cart');
      // Automatically redirect to signin page after a short delay to show toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Cart is only available for customers');
      return;
    }

    const variant = product.variants[variantIndex];
    let inventoryProductId = variant.inventoryProductId || '';
    
    // ✅ FIX: For combo products, if inventoryProductId is missing, fallback to product.id
    if (!inventoryProductId && product.type === 'combo') {
      console.log('📦 Product is combo and missing inventoryProductId, falling back to productId');
      inventoryProductId = product.id;
    }
    
    // ✅ FIX: Properly get available stock from variant
    // The field should be variantStockQuantity based on the Product interface
    const availableStock = variant?.variantStockQuantity || 0;
    
    // ✅ DEBUG: Log stock information for troubleshooting
    console.log('🛒 Add to cart - Stock check:', {
      productName: product.shortDescription,
      variantName: variant?.variantName,
      variantIndex,
      inventoryProductId,
      availableStock,
      variantStockStatus: variant?.variantStockStatus,
      hasVariant: !!variant
    });
    
    // ✅ FIX: Check if variant exists and validate stock
    if (!variant) {
      console.error('❌ Variant not found');
      toast.error('Product variant not found');
      return;
    }
    
    // ✅ FIX: Check both stock quantity AND stock status
    const isOutOfStock = availableStock <= 0 || variant.variantStockStatus === 'out-of-stock';
    
    // Check stock availability
    if (isOutOfStock) {
      toast.error('This item is currently out of stock');
      return;
    }

    // Check if item already exists with SAME cutting style AND SAME variant
    // Different cutting styles OR different variants = different cart items
    const existingItem = items.find(
      item => item.productId === product.id && 
              item.inventoryProductId === inventoryProductId &&
              item.variantIndex === variantIndex && // ✅ Also check variant index to differentiate 500g vs 1kg
              (item.selectedCuttingStyle || null) === (cuttingStyle || null)
    );

    // ✅ Calculate total stock allocated across ALL variants of this inventory item
    // We need to convert each variant's quantity to base UOM to get accurate stock usage
    // Example: 1 unit of 500g variant = 500g, 1 unit of 1kg variant = 1000g
    const totalStockAllocated = items
      .filter(item => item.inventoryProductId === inventoryProductId)
      .reduce((sum, item) => {
        // Convert item quantity to base UOM
        if (item.variantUom && item.variantUomValue) {
          // Each unit uses variantUomValue amount of stock
          return sum + (item.quantity * item.variantUomValue);
        }
        return sum + item.quantity;
      }, 0);

    console.log('🛒 Total stock allocated for this inventory item:', {
      inventoryProductId,
      totalStockAllocated,
      availableStock
    });

    if (existingItem) {
      // ✅ Check if we can add more by comparing stock in the SAME UOM
      let canAddMore = false;
      
      if (variant.variantUom && variant.variantUomValue && variant.variantUomValue > 0) {
        // Convert allocated stock to current variant's UOM
        const cartItemsForThisInventory = items.filter(item => item.inventoryProductId === inventoryProductId);
        let allocatedInCurrentUOM = 0;
        
        for (const cartItem of cartItemsForThisInventory) {
          if (cartItem.variantUom && cartItem.variantUomValue) {
            const itemStockUsage = cartItem.quantity * cartItem.variantUomValue;
            
            if (cartItem.variantUom === variant.variantUom) {
              allocatedInCurrentUOM += itemStockUsage;
            } else {
              const converted = convertUOMValue(itemStockUsage, cartItem.variantUom, variant.variantUom);
              allocatedInCurrentUOM += converted !== null ? converted : itemStockUsage;
            }
          }
        }
        
        const remainingStock = availableStock - allocatedInCurrentUOM;
        canAddMore = remainingStock >= variant.variantUomValue;
      } else {
        // Simple unit count
        canAddMore = totalStockAllocated < availableStock;
      }
      
      if (!canAddMore) {
        toast.warning(`Not enough stock available`);
        return;
      }
      
      const newQuantity = existingItem.quantity + 1;
      
      // Optimistic update
      setItems(prev => prev.map(item => {
        if (item.productId === product.id && 
            item.inventoryProductId === inventoryProductId &&
            (item.selectedCuttingStyle || null) === (cuttingStyle || null)) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));

      try {
        await cartService.addToCart({
          userId: user.id,
          inventoryProductId,
          quantity: 1,
          selectedCuttingStyle: cuttingStyle
        });
        toast.success('Cart updated');
        
        // ✅ FIX: Reload cart silently to get fresh stock data
        await loadCart(true);
      } catch (error) {
        console.error('Error updating cart:', error);
        // Revert (reload cart)
        loadCart();
        toast.error('Failed to update cart');
      }

      return;
    }

    // ✅ Check stock for new item by comparing in the SAME UOM
    let canAddNewItem = false;
    
    if (variant.variantUom && variant.variantUomValue && variant.variantUomValue > 0) {
      // ✅ CRITICAL: Convert totalStockAllocated to current variant's UOM
      // totalStockAllocated is in the UOM of items already in cart
      // We need to convert it to match availableStock's UOM
      
      // Find what UOM the allocated stock is in by checking cart items
      const cartItemsForThisInventory = items.filter(item => item.inventoryProductId === inventoryProductId);
      
      // Convert allocated stock to current variant's UOM using dynamic conversion
      let allocatedInCurrentUOM = 0;
      for (const cartItem of cartItemsForThisInventory) {
        if (cartItem.variantUom && cartItem.variantUomValue) {
          const itemStockUsage = cartItem.quantity * cartItem.variantUomValue;
          
          // If cart item UOM matches current variant UOM, use directly
          if (cartItem.variantUom === variant.variantUom) {
            allocatedInCurrentUOM += itemStockUsage;
          } else {
            // ✅ Use dynamic UOM conversion with convert-units package
            const converted = convertUOMValue(itemStockUsage, cartItem.variantUom, variant.variantUom);
            if (converted !== null) {
              allocatedInCurrentUOM += converted;
            } else {
              // Conversion failed, use as-is (fallback)
              console.warn(`Failed to convert ${itemStockUsage}${cartItem.variantUom} to ${variant.variantUom}`);
              allocatedInCurrentUOM += itemStockUsage;
            }
          }
        }
      }
      
      // Now compare in the same UOM
      const remainingStock = availableStock - allocatedInCurrentUOM;
      canAddNewItem = remainingStock >= variant.variantUomValue;
      
      console.log('🛒 Add to cart - Stock check for new item:', {
        availableStock,
        variantUom: variant.variantUom,
        totalStockAllocated,
        allocatedInCurrentUOM,
        remainingStock,
        variantUomValue: variant.variantUomValue,
        canAddNewItem
      });
    } else {
      // Simple unit count
      canAddNewItem = totalStockAllocated < availableStock;
    }
    
    if (!canAddNewItem) {
      toast.warning(`Not enough stock for 1 unit of this variant`);
      return;
    }

    // Stock validation passed, add 1 unit
    const quantityToAdd = 1;

    // New Item
    // Optimistically update UI
    const newItem: CartItem = {
      productId: product.id,
      inventoryProductId,
      variantIndex,
      quantity: quantityToAdd,
      maxStock: availableStock,
      shortDescription: product.shortDescription,
      brand: product.brand,
      variantName: variant.variantName,
      displayName: variant.displayName || variant.variantName,
      variantSellingPrice: variant.variantSellingPrice,
      variantMRP: variant.variantMRP,
      variantImage: variant.variantImages?.[0] || '',
      category: product.category,
      selectedCuttingStyle: cuttingStyle,
      // 🆕 Store UOM info for stock calculations
      variantUom: variant.variantUom,
      variantUomValue: variant.variantUomValue,
      // 🆕 Store shipping info for delivery cost calculation
      freeShipping: product.freeShipping,
      shippingCharge: product.shippingCharge,
    };

    setItems(prev => [...prev, newItem]);

    try {
      await cartService.addToCart({
        userId: user.id,
        inventoryProductId,
        variantIndex, // ✅ Pass variant index to backend to prevent merging separate variants
        quantity: quantityToAdd,
        selectedCuttingStyle: cuttingStyle,
      });
      toast.success('Added to cart');
      
      // ✅ FIX: Reload cart silently to get fresh stock data
      await loadCart(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Handle the state revert
      setItems(prev => prev.filter(item => 
        !(item.inventoryProductId === inventoryProductId && 
          (item.selectedCuttingStyle || null) === (cuttingStyle || null))
      ));
      
      // Handle specific error cases and show message to user
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            data?: { 
              error?: string; 
              message?: string;
            } 
          } 
        };
        
        const errorMessage = axiosError.response?.data?.error || 
                            axiosError.response?.data?.message || 
                            'Failed to add item to cart';

        // Handle 404 Customer not found error specifically
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.error?.includes('Customer not found')) {
          toast.error('Account setup in progress. Please wait a moment and try again.', {
            duration: 4000,
          });
          
          // Auto-retry after 2 seconds
          setTimeout(async () => {
            try {
              await cartService.addToCart({
                userId: user.id,
                inventoryProductId,
                quantity: 1,
                selectedCuttingStyle: cuttingStyle,
              });
              setItems(prev => [...prev, newItem]);
              toast.success('Added to cart');
            } catch (retryError) {
              console.error('Retry failed:', retryError);
            }
          }, 2000);
          return;
        } else if (axiosError.response?.status === 400) {
          // Show validation errors (like insufficient stock)
          toast.error(errorMessage, {
            duration: 4000,
          });
          return;
        } else {
          toast.error(errorMessage);
          return;
        }
      }
      
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (productId: string, inventoryProductId: string, variantIndex: number, selectedCuttingStyle?: string) => {
    // Check if user is authenticated and is a customer
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to manage your cart');
      // Automatically redirect to signin page after a short delay to show toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Cart is only available for customers');
      return;
    }

    // ✅ Find the item to get its variantIndex
    const itemToRemove = items.find(
      item => item.productId === productId && 
              item.inventoryProductId === inventoryProductId &&
              item.variantIndex === variantIndex &&
              (item.selectedCuttingStyle || null) === (selectedCuttingStyle || null)
    );

    if (!itemToRemove) {
      console.error('Item not found in cart');
      return;
    }

    // Optimistic update - match by cutting style too
    const previousItems = items;
    setItems(prev => prev.filter(
      item => !(item.productId === productId && 
                item.inventoryProductId === inventoryProductId &&
                item.variantIndex === itemToRemove.variantIndex &&
                (item.selectedCuttingStyle || null) === (selectedCuttingStyle || null))
    ));

    try {
      await cartService.removeFromCart(user.id, inventoryProductId, itemToRemove.variantIndex, selectedCuttingStyle);
      toast.success('Removed from cart');
      
      // ✅ FIX: Reload cart silently to get fresh stock data for remaining items
      await loadCart(true);
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert on error
      setItems(previousItems);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        
        // Handle 404 Customer not found error
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.error?.includes('Customer not found')) {
          toast.error('Account setup in progress. Please refresh the page and try again.', {
            duration: 4000,
          });
          return;
        }
      }
      
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (productId: string, inventoryProductId: string, variantIndex: number, quantity: number, selectedCuttingStyle?: string): Promise<string | null> => {
    // Check if user is authenticated and is a customer
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to manage your cart');
      // Automatically redirect to signin page after a short delay to show toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      return null;
    }

    if (user?.role !== 'user') {
      toast.error('Cart is only available for customers');
      return null;
    }

    if (quantity <= 0) {
      await removeFromCart(productId, inventoryProductId, variantIndex, selectedCuttingStyle);
      return null;
    }

    // Find the specific item
    const targetItem = items.find(
      item => item.productId === productId && 
              item.inventoryProductId === inventoryProductId &&
              item.variantIndex === variantIndex &&
              (item.selectedCuttingStyle || null) === (selectedCuttingStyle || null)
    );

    if (!targetItem) {
      console.error('Target item not found in cart:', { productId, inventoryProductId, selectedCuttingStyle });
      return null;
    }

    console.log('Updating cart item:', {
      productId,
      inventoryProductId,
      quantity,
      selectedCuttingStyle,
      targetItem
    });

    // ✅ Calculate max allowed quantity based on UOM with dynamic conversion
    let maxAllowedForThis: number;
    
    if (targetItem.variantUom && targetItem.variantUomValue && targetItem.variantUomValue > 0) {
      // ✅ maxStock is already in variant UOM (backend handles conversion)
      // Calculate how much stock is allocated to OTHER cart items (different variants/cutting styles)
      // We need to convert each item's stock usage to current variant's UOM
      
      const otherCartItems = items.filter(
        item => item.inventoryProductId === inventoryProductId &&
                !((item.selectedCuttingStyle || null) === (selectedCuttingStyle || null))
      );
      
      let stockAllocatedToOthers = 0;
      
      for (const otherItem of otherCartItems) {
        if (otherItem.variantUom && otherItem.variantUomValue) {
          // Calculate stock usage for this other item
          const itemStockUsage = otherItem.quantity * otherItem.variantUomValue;
          
          // Convert to target item's UOM if different
          if (otherItem.variantUom === targetItem.variantUom) {
            stockAllocatedToOthers += itemStockUsage;
          } else {
            // ✅ Use dynamic UOM conversion
            const converted = convertUOMValue(itemStockUsage, otherItem.variantUom, targetItem.variantUom);
            if (converted !== null) {
              stockAllocatedToOthers += converted;
            } else {
              console.warn(`Failed to convert ${itemStockUsage}${otherItem.variantUom} to ${targetItem.variantUom}`);
              stockAllocatedToOthers += itemStockUsage; // Fallback
            }
          }
        }
      }
      
      const remainingStockInUOM = targetItem.maxStock - stockAllocatedToOthers;
      maxAllowedForThis = Math.floor(remainingStockInUOM / targetItem.variantUomValue);
      
      console.log('🛒 Update quantity - UOM calculation:', {
        productName: targetItem.displayName,
        maxStock: targetItem.maxStock,
        variantUom: targetItem.variantUom,
        variantUomValue: targetItem.variantUomValue,
        otherCartItems: otherCartItems.length,
        stockAllocatedToOthers,
        remainingStockInUOM,
        maxAllowedForThis
      });
    } else {
      // Simple unit-based calculation
      const otherItemsQuantity = items
        .filter(item => item.inventoryProductId === inventoryProductId &&
                        !((item.selectedCuttingStyle || null) === (selectedCuttingStyle || null)))
        .reduce((sum, item) => sum + item.quantity, 0);
      
      maxAllowedForThis = targetItem.maxStock - otherItemsQuantity;
      
      console.log('🛒 Update quantity - Simple calculation:', {
        maxStock: targetItem.maxStock,
        otherItemsQuantity,
        maxAllowedForThis
      });
    }
    
    // ✅ Optimistic update - update UI immediately
    const previousItems = items;
    const validatedQuantity = Math.min(quantity, maxAllowedForThis);
    
    if (validatedQuantity < quantity) {
      toast.warning(`Only ${maxAllowedForThis} units available in stock`);
    }
    
    setItems(prev => prev.map(item => {
      if (item.productId === productId && 
          item.inventoryProductId === inventoryProductId &&
          item.variantIndex === variantIndex &&
          (item.selectedCuttingStyle || null) === (selectedCuttingStyle || null)) {
        return { ...item, quantity: validatedQuantity };
      }
      return item;
    }));

    try {
      await cartService.updateCartItem(user.id, inventoryProductId, targetItem.variantIndex, validatedQuantity, selectedCuttingStyle);
      
      // ✅ Success - keep the optimistic update, no refresh needed
      // The optimistic update is already correct
      
      return null; // Success
    } catch (error) {
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        
        // Suppress logging for expected 400 Bad Request (validation errors)
        if (axiosError.response?.status !== 400) {
           console.error('Error updating cart:', error);
        }
        
        // Handle 404 - Cart item not found (stale data)
        if (axiosError.response?.status === 404) {
          // Don't show multiple toasts, just refresh silently
          console.log('Cart item not found, refreshing cart from server...');
          await loadCart(true);
          toast.info('Cart updated from server', {
            duration: 2000,
          });
          return null;
        }
        
        // Handle 404 Customer not found error
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.error?.includes('Customer not found')) {
          toast.error('Account setup in progress. Please refresh the page and try again.', {
            duration: 4000,
          });
          // Reload cart from server
          await loadCart(true);
          return null;
        }
      }
      
      // Revert on other errors
      setItems(previousItems);

      // Extract specific error message
      let errorMessage = 'Failed to update cart';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
        
        // Show toast for 400 errors (validation failures)
        if (axiosError.response?.status === 400) {
          toast.error(errorMessage);
        }
      }
      
      // Return the error message to the caller (component) to display inline
      return errorMessage;
    }
  };

  const getItemQuantity = (productId: string, inventoryProductId: string, variantIndex: number, selectedCuttingStyle?: string): number => {
    if (!isAuthenticated || user?.role !== 'user') return 0;
    
    const item = items.find(
      item => item.productId === productId && 
              item.inventoryProductId === inventoryProductId &&
              item.variantIndex === variantIndex && // ✅ Also check variantIndex
              (item.selectedCuttingStyle || null) === (selectedCuttingStyle || null)
    );
    return item?.quantity || 0;
  };

  const clearCart = async () => {
    // Check if user is authenticated and is a customer
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to manage your cart');
      // Automatically redirect to signin page after a short delay to show toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Cart is only available for customers');
      return;
    }

    // Optimistic update
    const previousItems = items;
    setItems([]);

    try {
      await cartService.clearCart(user.id);
      // No toast here - let the caller decide whether to show a message
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Revert on error
      setItems(previousItems);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        
        // Handle 404 Customer not found error
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.error?.includes('Customer not found')) {
          toast.error('Account setup in progress. Please refresh the page and try again.', {
            duration: 4000,
          });
          return;
        }
      }
      
      toast.error('Failed to clear cart');
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.variantSellingPrice * item.quantity), 
    0
  );
  
  const totalSavings = items.reduce(
    (sum, item) => sum + ((item.variantMRP - item.variantSellingPrice) * item.quantity), 
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      getItemQuantity,
      clearCart,
      refreshCart: () => loadCart(true), // ✅ NEW: Expose loadCart as refreshCart with silent mode
      totalItems,
      totalPrice,
      totalSavings,
      isLoading,
      isInitialized,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
