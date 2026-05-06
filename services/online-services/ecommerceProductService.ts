import axiosInstance from "@/lib/axios";
import { ProductFormData, ProductData, ProductListParams, ProductListResponse, ProductResponse } from "@/types/product";

/**
 * Service for managing e-commerce products (online products)
 */
class EcommerceProductService {
  private baseURL = "/api/online/online-products";

  /**
   * Get all online products with pagination and filters
   */
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    try {
      const response = await axiosInstance.get(this.baseURL, { params });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData: ProductFormData | FormData, imageFiles?: { variantIndex: number; imageIndex: number; file: File }[]): Promise<ProductResponse> {
    try {
      console.log("🔵 Service: Calling POST", this.baseURL);
      
      // Check if productData is already FormData (combo products)
      if (productData instanceof FormData) {
        console.log("🔵 Service: Sending FormData directly (combo product)");
        
        const response = await axiosInstance.post(this.baseURL, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      }
      
      console.log("🔵 Service: Data:", productData);
      console.log("🔵 Service: Image files:", imageFiles?.length || 0);
      
      // Create FormData if there are image files
      if (imageFiles && imageFiles.length > 0) {
        const formData = new FormData();
        
        // Append product data as JSON string
        formData.append('productData', JSON.stringify(productData));
        
        // Append all image files with proper field names
        imageFiles.forEach(({ variantIndex, imageIndex, file }) => {
          formData.append(`variant_${variantIndex}_image_${imageIndex}`, file);
        });
        
        console.log("🔵 Service: Sending as FormData with", imageFiles.length, "files");
        
        const response = await axiosInstance.post(this.baseURL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      } else {
        // No files, send as JSON
        console.log("🔵 Service: Sending as JSON (no files)");
        const response = await axiosInstance.post(this.baseURL, productData);
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error("🔴 Service: Error creating product:", error);
      console.error("🔴 Service: Error response:", error.response?.data);
      console.error("🔴 Service: Error status:", error.response?.status);
      throw error;
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id: string, productData: Partial<ProductFormData> | FormData, imageFiles?: { variantIndex: number; imageIndex: number; file: File }[]): Promise<ProductResponse> {
    try {
      console.log("🔵 Service: Calling PUT", `${this.baseURL}/${id}`);
      
      // Check if productData is already FormData (combo products)
      if (productData instanceof FormData) {
        console.log("🔵 Service: Sending FormData directly (combo product)");
        
        const response = await axiosInstance.put(`${this.baseURL}/${id}`, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      }
      
      console.log("🔵 Service: Data:", productData);
      console.log("🔵 Service: Image files:", imageFiles?.length || 0);
      
      // Create FormData if there are image files
      if (imageFiles && imageFiles.length > 0) {
        const formData = new FormData();
        
        // Append product data as JSON string
        formData.append('productData', JSON.stringify(productData));
        
        // Append all image files with proper field names
        imageFiles.forEach(({ variantIndex, imageIndex, file }) => {
          formData.append(`variant_${variantIndex}_image_${imageIndex}`, file);
        });
        
        console.log("🔵 Service: Sending as FormData with", imageFiles.length, "files");
        
        const response = await axiosInstance.put(`${this.baseURL}/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      } else {
        // No files, send as JSON
        console.log("🔵 Service: Sending as JSON (no files)");
        const response = await axiosInstance.put(`${this.baseURL}/${id}`, productData);
        console.log("🔵 Service: Response received:", response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error("🔴 Service: Error updating product:", error);
      console.error("🔴 Service: Error response:", error.response?.data);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  /**
   * Generate SEO content using Groq API
   */
  async generateSEO(data: { productName: string; category?: string; subCategory?: string; shortDescription?: string }): Promise<any> {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/generate-seo`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error generating SEO:", error);
      throw error;
    }
  }
}

export const ecommerceProductService = new EcommerceProductService();
