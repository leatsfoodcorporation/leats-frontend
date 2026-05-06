import axiosInstance from "@/lib/axios";

export interface CartItem {
  id: string;
  userId: string;
  customerId: string;
  inventoryProductId: string;
  productId: string;
  variantIndex: number;
  quantity: number;
  maxStock: number;
  shortDescription: string;
  brand: string;
  variantName: string;
  displayName?: string;
  variantSellingPrice: number;
  variantMRP: number;
  variantImage?: string | null;
  selectedCuttingStyle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalSavings: number;
}

export interface AddToCartRequest {
  userId: string;
  inventoryProductId: string;
  variantIndex?: number;
  quantity?: number;
  selectedCuttingStyle?: string;
}

export interface UpdateCartRequest {
  userId: string;
  quantity: number;
  selectedCuttingStyle?: string;
}

export interface SyncCartRequest {
  userId: string;
  items: {
    inventoryProductId: string;
    quantity: number;
    selectedCuttingStyle?: string;
  }[];
}

class CartService {
  private baseURL = "/api/online/cart";

  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<CartResponse> {
    const response = await axiosInstance.get(this.baseURL, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartRequest): Promise<{
    success: boolean;
    data: CartItem;
    message: string;
  }> {
    const response = await axiosInstance.post(this.baseURL, data);
    return response.data;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    inventoryProductId: string,
    data: UpdateCartRequest
  ): Promise<{
    success: boolean;
    data?: CartItem;
    message: string;
  }> {
    const response = await axiosInstance.put(
      `${this.baseURL}/${inventoryProductId}`,
      data
    );
    return response.data;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    inventoryProductId: string,
    userId: string,
    selectedCuttingStyle?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axiosInstance.delete(
      `${this.baseURL}/${inventoryProductId}`,
      {
        params: { userId, selectedCuttingStyle },
      }
    );
    return response.data;
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<{
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
   * Sync local cart to database (on login)
   */
  async syncCart(data: SyncCartRequest): Promise<CartResponse & {
    message: string;
  }> {
    const response = await axiosInstance.post(`${this.baseURL}/sync`, data);
    return response.data;
  }
}

export const cartService = new CartService();
