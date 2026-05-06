import axiosInstance from "@/lib/axios";

export interface WishlistItem {
  wishlistItemId: string;
  addedAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Product data fields
}

export interface WishlistResponse {
  success: boolean;
  data: WishlistItem[];
}

export interface AddToWishlistRequest {
  userId: string;
  productId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productData: Record<string, any>;
}

export interface CheckWishlistResponse {
  success: boolean;
  data: {
    isInWishlist: boolean;
    wishlistItemId?: string;
  };
}

class WishlistService {
  private baseURL = "/api/online/wishlist";

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string): Promise<WishlistResponse> {
    const response = await axiosInstance.get(this.baseURL, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Add item to wishlist
   */
  async addToWishlist(data: AddToWishlistRequest): Promise<{
    success: boolean;
    message: string;
    data: WishlistItem;
  }> {
    const response = await axiosInstance.post(this.baseURL, data);
    return response.data;
  }

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(
    productId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axiosInstance.delete(
      `${this.baseURL}/${productId}`,
      {
        params: { userId },
      }
    );
    return response.data;
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      removedCount: number;
    };
  }> {
    const response = await axiosInstance.delete(this.baseURL, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Check if product is in wishlist
   */
  async checkWishlistItem(
    productId: string,
    userId: string
  ): Promise<CheckWishlistResponse> {
    const response = await axiosInstance.get(
      `${this.baseURL}/check/${productId}`,
      {
        params: { userId },
      }
    );
    return response.data;
  }
}

export const wishlistService = new WishlistService();
