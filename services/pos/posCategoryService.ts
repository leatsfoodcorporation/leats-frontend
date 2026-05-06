import axiosInstance from "@/lib/axios";

/**
 * POS Category Service
 * Categories are from inventory service
 * Route: /api/inventory/categories
 */

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
}

class POSCategoryService {
  private baseURL = "/api/inventory/categories";

  /**
   * Get all active categories
   */
  async getActiveCategories(): Promise<CategoryListResponse> {
    const response = await axiosInstance.get(this.baseURL, {
      params: { isActive: true },
    });
    return response.data;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<CategoryListResponse> {
    const response = await axiosInstance.get(this.baseURL);
    return response.data;
  }
}

export const posCategoryService = new POSCategoryService();
