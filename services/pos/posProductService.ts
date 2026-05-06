import axiosInstance from "@/lib/axios";

/**
 * POS Product Service
 * Handles all POS product-related API calls
 * Routes changed from /api/offline/* to /api/pos/* for monolith architecture
 */

export interface POSProduct {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  itemCode?: string;
  barcode?: string;
  brand?: string;
  uom: string;
  purchasePrice: number;
  sellingPrice?: number;
  mrp?: number;
  gstRateId?: string;
  gstPercentage: number;
  hsnCode?: string;
  discountType?: string;
  discountValue?: number;
  warehouse: string;
  quantity: number;
  openingStock: number;
  lowStockAlertLevel: number;
  status: string;
  display: string;
  expiryDate?: string;
  mfgDate?: string;
  batchNo?: string;
  safetyInformation?: string;
  description?: string;
  itemImage?: string;
  displayPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface POSProductListResponse {
  success: boolean;
  data: POSProduct[];
  count: number;
}

export interface POSProductResponse {
  success: boolean;
  data: POSProduct;
}

class POSProductService {
  private baseURL = "/api/pos/products";

  /**
   * Get all POS products
   */
  async getAllProducts(params?: {
    category?: string;
    status?: string;
    display?: string;
  }): Promise<POSProductListResponse> {
    const response = await axiosInstance.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get POS product by ID
   */
  async getProductById(id: string): Promise<POSProductResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create POS product from inventory item
   */
  async createProduct(itemId: string): Promise<POSProductResponse> {
    const response = await axiosInstance.post(this.baseURL, { itemId });
    return response.data;
  }

  /**
   * Update POS product
   */
  async updateProduct(
    id: string,
    data: FormData
  ): Promise<POSProductResponse> {
    const response = await axiosInstance.put(`${this.baseURL}/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Toggle POS product display status
   */
  async toggleDisplay(
    id: string,
    display: "active" | "inactive"
  ): Promise<POSProductResponse> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/display`, {
      display,
    });
    return response.data;
  }

  /**
   * Sync POS product from inventory item
   */
  async syncProduct(id: string): Promise<POSProductResponse> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/sync`);
    return response.data;
  }

  /**
   * Delete POS product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}`);
    return response.data;
  }
}

export const posProductService = new POSProductService();
