import axiosInstance from "@/lib/axios";
import {
  ProductData,
  ProductFormData,
  ProductListParams,
  ProductListResponse,
  ProductResponse,
  SEOResponse,
  MediaUploadResponse,
} from "@/types/product";

class ProductService {
  private baseURL = "/api/products";

  /**
   * Get all products with pagination and filters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with product list and pagination data
   */
  async getProducts(
    params: ProductListParams = {}
  ): Promise<ProductListResponse> {
    const response = await axiosInstance.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get product by ID
   * @param id - Product ID
   * @returns Promise with product data
   */
  async getProductById(id: string): Promise<ProductResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new product with images and videos
   * @param data - Product form data
   * @param images - Array of image files to upload
   * @param videos - Array of video files to upload
   * @returns Promise with created product data
   */
  async createProduct(
    data: ProductFormData,
    images: File[] = [],
    videos: File[] = []
  ): Promise<ProductResponse> {
    const formData = new FormData();

    // Append basic product fields
    formData.append("productName", data.productName);
    formData.append("description", data.description);
    formData.append("categoryId", data.categoryId);
    formData.append("subcategoryId", data.subcategoryId);
    formData.append("brand", data.brand);
    formData.append("sku", data.sku);
    formData.append("basePrice", data.basePrice.toString());
    formData.append("metaTitle", data.metaTitle);
    formData.append("metaDescription", data.metaDescription);
    formData.append("metaKeywords", data.metaKeywords);
    formData.append("status", data.status);

    // Append optional fields
    if (data.salePrice !== undefined && data.salePrice !== null) {
      formData.append("salePrice", data.salePrice.toString());
    }
    if (data.costPrice !== undefined && data.costPrice !== null) {
      formData.append("costPrice", data.costPrice.toString());
    }
    if (data.weight !== undefined && data.weight !== null) {
      formData.append("weight", data.weight.toString());
    }
    if (data.weightUnit) {
      formData.append("weightUnit", data.weightUnit);
    }
    if (data.length !== undefined && data.length !== null) {
      formData.append("length", data.length.toString());
    }
    if (data.width !== undefined && data.width !== null) {
      formData.append("width", data.width.toString());
    }
    if (data.height !== undefined && data.height !== null) {
      formData.append("height", data.height.toString());
    }
    if (data.dimensionUnit) {
      formData.append("dimensionUnit", data.dimensionUnit);
    }

    // Append variants as JSON string
    if (data.variants && data.variants.length > 0) {
      formData.append("variants", JSON.stringify(data.variants));
    }

    // Append specifications as JSON string
    if (data.specifications && data.specifications.length > 0) {
      formData.append("specifications", JSON.stringify(data.specifications));
    }

    // Append image files
    images.forEach((image, index) => {
      formData.append("images", image);
    });

    // Append video files
    videos.forEach((video, index) => {
      formData.append("videos", video);
    });

    const response = await axiosInstance.post(this.baseURL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Update existing product with images and videos
   * @param id - Product ID
   * @param data - Product form data
   * @param images - Array of image files (File) or existing URLs (string)
   * @param videos - Array of video files (File) or existing URLs (string)
   * @returns Promise with updated product data
   */
  async updateProduct(
    id: string,
    data: ProductFormData,
    images: (File | string)[] = [],
    videos: (File | string)[] = []
  ): Promise<ProductResponse> {
    const formData = new FormData();

    // Append basic product fields
    formData.append("productName", data.productName);
    formData.append("description", data.description);
    formData.append("categoryId", data.categoryId);
    formData.append("subcategoryId", data.subcategoryId);
    formData.append("brand", data.brand);
    formData.append("sku", data.sku);
    formData.append("basePrice", data.basePrice.toString());
    formData.append("metaTitle", data.metaTitle);
    formData.append("metaDescription", data.metaDescription);
    formData.append("metaKeywords", data.metaKeywords);
    formData.append("status", data.status);

    // Append optional fields
    if (data.salePrice !== undefined && data.salePrice !== null) {
      formData.append("salePrice", data.salePrice.toString());
    }
    if (data.costPrice !== undefined && data.costPrice !== null) {
      formData.append("costPrice", data.costPrice.toString());
    }
    if (data.weight !== undefined && data.weight !== null) {
      formData.append("weight", data.weight.toString());
    }
    if (data.weightUnit) {
      formData.append("weightUnit", data.weightUnit);
    }
    if (data.length !== undefined && data.length !== null) {
      formData.append("length", data.length.toString());
    }
    if (data.width !== undefined && data.width !== null) {
      formData.append("width", data.width.toString());
    }
    if (data.height !== undefined && data.height !== null) {
      formData.append("height", data.height.toString());
    }
    if (data.dimensionUnit) {
      formData.append("dimensionUnit", data.dimensionUnit);
    }

    // Append variants as JSON string
    if (data.variants && data.variants.length > 0) {
      formData.append("variants", JSON.stringify(data.variants));
    }

    // Append specifications as JSON string
    if (data.specifications && data.specifications.length > 0) {
      formData.append("specifications", JSON.stringify(data.specifications));
    }

    // Separate new image files from existing URLs
    const newImages: File[] = [];
    const existingImageUrls: string[] = [];
    images.forEach((image) => {
      if (image instanceof File) {
        newImages.push(image);
      } else {
        existingImageUrls.push(image);
      }
    });

    // Separate new video files from existing URLs
    const newVideos: File[] = [];
    const existingVideoUrls: string[] = [];
    videos.forEach((video) => {
      if (video instanceof File) {
        newVideos.push(video);
      } else {
        existingVideoUrls.push(video);
      }
    });

    // Append existing media URLs as JSON
    if (existingImageUrls.length > 0) {
      formData.append("existingImages", JSON.stringify(existingImageUrls));
    }
    if (existingVideoUrls.length > 0) {
      formData.append("existingVideos", JSON.stringify(existingVideoUrls));
    }

    // Append new image files
    newImages.forEach((image) => {
      formData.append("images", image);
    });

    // Append new video files
    newVideos.forEach((video) => {
      formData.append("videos", video);
    });

    const response = await axiosInstance.put(
      `${this.baseURL}/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  /**
   * Delete product by ID
   * @param id - Product ID
   * @returns Promise with success status and message
   */
  async deleteProduct(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Generate SEO metadata based on product information
   * @param productName - Product name
   * @param category - Category name
   * @param description - Product description
   * @returns Promise with generated SEO data
   */
  async generateSEO(
    productName: string,
    category: string,
    description: string
  ): Promise<SEOResponse> {
    const response = await axiosInstance.post(
      `${this.baseURL}/generate-seo`,
      {
        productName,
        category,
        description,
      }
    );
    return response.data;
  }

  /**
   * Upload a single media file (image or video)
   * @param file - File to upload
   * @param type - Media type ('image' or 'video')
   * @returns Promise with uploaded file URL
   */
  async uploadMedia(
    file: File,
    type: "image" | "video"
  ): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await axiosInstance.post(
      `${this.baseURL}/upload-media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }
}

export const productService = new ProductService();