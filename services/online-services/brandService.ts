import axiosInstance from "@/lib/axios";

export interface Brand {
  id: string;
  name: string;
}

export interface BrandResponse {
  success: boolean;
  data: Brand[];
  message?: string;
}

export interface SingleBrandResponse {
  success: boolean;
  data: Brand;
  message?: string;
}

export const brandService = {
  // Get all brands
  getAllBrands: async (): Promise<BrandResponse> => {
    const response = await axiosInstance.get("/api/online/brands");
    return response.data;
  },

  // Create brand
  createBrand: async (name: string): Promise<SingleBrandResponse> => {
    const response = await axiosInstance.post("/api/online/brands", { name });
    return response.data;
  },

  // Update brand
  updateBrand: async (id: string, name: string): Promise<SingleBrandResponse> => {
    const response = await axiosInstance.put(`/api/online/brands/${id}`, { name });
    return response.data;
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/online/brands/${id}`);
    return response.data;
  },
};
