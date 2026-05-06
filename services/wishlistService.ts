import axiosInstance from '@/lib/axios';

export interface WishlistProduct {
  wishlistItemId: string;
  addedAt: string;
  id: string;
  [key: string]: unknown; // Allow other product properties
}

/**
 * Get user's wishlist (from online-service)
 */
export const getWishlist = async (userId: string): Promise<WishlistProduct[]> => {
  try {
    const response = await axiosInstance.get(`/api/online/wishlist`, {
      params: { userId },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Get wishlist error:', error);
    throw error;
  }
};

/**
 * Add product to wishlist (stored in online-service)
 */
export const addToWishlist = async (
  userId: string,
  productId: string,
  productData: Record<string, unknown>,
  userName?: string,
  userEmail?: string
): Promise<WishlistProduct> => {
  try {
    const response = await axiosInstance.post(`/api/online/wishlist`, {
      userId,
      productId,
      productData,
      userName,
      userEmail,
    });
    return response.data.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { data?: WishlistProduct } } };
      if (axiosError.response?.status === 409) {
        // Product already in wishlist
        return axiosError.response.data?.data as WishlistProduct;
      }
    }
    console.error('Add to wishlist error:', error);
    throw error;
  }
};

/**
 * Remove product from wishlist (from online-service)
 */
export const removeFromWishlist = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/online/wishlist/${productId}`, {
      params: { userId },
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    throw error;
  }
};

/**
 * Clear entire wishlist (from online-service)
 */
export const clearWishlist = async (userId: string): Promise<number> => {
  try {
    const response = await axiosInstance.delete(`/api/online/wishlist`, {
      params: { userId },
    });
    return response.data.data?.removedCount || 0;
  } catch (error) {
    console.error('Clear wishlist error:', error);
    throw error;
  }
};

/**
 * Check if product is in wishlist (from online-service)
 */
export const checkWishlistItem = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const response = await axiosInstance.get(
      `/api/online/wishlist/check/${productId}`,
      {
        params: { userId },
      }
    );
    return response.data.data?.isInWishlist || false;
  } catch (error) {
    console.error('Check wishlist item error:', error);
    return false;
  }
};
