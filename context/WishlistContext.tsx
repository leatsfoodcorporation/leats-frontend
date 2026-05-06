'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product } from '@/services/online-services/frontendProductService';
import { Product as MockProduct } from '@/MockData/ProductData';
import { useAuthContext } from '@/components/providers/auth-provider';
import * as wishlistService from '@/services/wishlistService';
import { WishlistProduct as BackendWishlistProduct } from '@/services/wishlistService';
import { toast } from 'sonner';

// Union type to support both product types
export type WishlistProduct = Product | MockProduct | BackendWishlistProduct;

interface WishlistContextType {
  items: WishlistProduct[];
  addToWishlist: (product: WishlistProduct) => Promise<void>;
  removeFromWishlist: (productId: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
  clearWishlist: () => Promise<void>;
  totalItems: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuthContext();

  // Load wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.role === 'user') {
      loadWishlist();
    } else {
      // Clear wishlist when user logs out or is admin
      setItems([]);
    }
  }, [user?.id, user?.role, isAuthenticated]);

  const loadWishlist = async () => {
    if (!isAuthenticated || !user?.id || user?.role !== 'user') return;

    try {
      setIsLoading(true);
      const backendItems = await wishlistService.getWishlist(user.id);
      setItems(backendItems as WishlistProduct[]);
    } catch (error: any) {
      console.error('Error loading wishlist from backend:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Unable to load wishlist. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (product: WishlistProduct) => {
    // Check if user is authenticated and is a customer (not admin)
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to add items to your wishlist');
      // Automatically redirect to signin page after a short delay to show toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Wishlist is only available for customers');
      return;
    }

    const productId = typeof product.id === 'string' ? product.id : product.id.toString();
    
    // Check if already exists
    const exists = items.some(item => {
      const itemId = typeof item.id === 'string' ? item.id : item.id.toString();
      return itemId === productId;
    });
    
    if (exists) {
      toast.info('Product already in wishlist');
      return;
    }

    // Optimistically update UI
    setItems(prev => [...prev, product]);

    try {
      await wishlistService.addToWishlist(
        user.id, 
        productId, 
        product,
        user.name,
        user.email
      );
      toast.success('Added to wishlist');
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      
      // Revert on error
      setItems(prev => prev.filter(item => {
        const itemId = typeof item.id === 'string' ? item.id : item.id.toString();
        return itemId !== productId;
      }));
      
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string | number) => {
    // Check if user is authenticated and is a customer
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to manage your wishlist', {
        action: {
          label: 'Sign In',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/signin';
            }
          },
        },
      });
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Wishlist is only available for customers');
      return;
    }

    const targetId = typeof productId === 'string' ? productId : productId.toString();
    
    // Optimistically update UI
    const previousItems = items;
    const newItems = items.filter(item => {
      const itemId = typeof item.id === 'string' ? item.id : item.id.toString();
      return itemId !== targetId;
    });
    setItems(newItems);

    try {
      await wishlistService.removeFromWishlist(user.id, targetId);
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      
      // Revert on error
      setItems(previousItems);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string | number): boolean => {
    if (!isAuthenticated || user?.role !== 'user') return false;
    
    const targetId = typeof productId === 'string' ? productId : productId.toString();
    return items.some(item => {
      const itemId = typeof item.id === 'string' ? item.id : item.id.toString();
      return itemId === targetId;
    });
  };

  const clearWishlist = async () => {
    // Check if user is authenticated and is a customer
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to manage your wishlist', {
        action: {
          label: 'Sign In',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/signin';
            }
          },
        },
      });
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Wishlist is only available for customers');
      return;
    }

    // Optimistically update UI
    const previousItems = items;
    setItems([]);

    try {
      await wishlistService.clearWishlist(user.id);
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      
      // Revert on error
      setItems(previousItems);
      toast.error('Failed to clear wishlist');
    }
  };

  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      totalItems,
      isLoading,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

