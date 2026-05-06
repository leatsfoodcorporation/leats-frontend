import axiosInstance from "@/lib/axios";

export interface CuttingStyle {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CuttingStyleResponse {
  success: boolean;
  data: CuttingStyle[];
}

export interface SingleCuttingStyleResponse {
  success: boolean;
  data: CuttingStyle;
  message?: string;
}

export const cuttingStyleService = {
  // Get all cutting styles
  getAllCuttingStyles: async (): Promise<CuttingStyleResponse> => {
    const response = await axiosInstance.get("/api/online/cutting-styles");
    return response.data;
  },

  // Get active cutting styles only (for dropdowns)
  getActiveCuttingStyles: async (): Promise<CuttingStyleResponse> => {
    const response = await axiosInstance.get("/api/online/cutting-styles/active");
    return response.data;
  },

  // Get cutting style by ID
  getCuttingStyleById: async (id: string): Promise<SingleCuttingStyleResponse> => {
    const response = await axiosInstance.get(`/api/online/cutting-styles/${id}`);
    return response.data;
  },

  // Create cutting style
  createCuttingStyle: async (data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }): Promise<SingleCuttingStyleResponse> => {
    const response = await axiosInstance.post("/api/online/cutting-styles", data);
    return response.data;
  },

  // Update cutting style
  updateCuttingStyle: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ): Promise<SingleCuttingStyleResponse> => {
    const response = await axiosInstance.put(`/api/online/cutting-styles/${id}`, data);
    return response.data;
  },

  // Toggle cutting style status
  toggleCuttingStyleStatus: async (id: string): Promise<SingleCuttingStyleResponse> => {
    const response = await axiosInstance.patch(`/api/online/cutting-styles/${id}/toggle`);
    return response.data;
  },

  // Delete cutting style
  deleteCuttingStyle: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/online/cutting-styles/${id}`);
    return response.data;
  },
};
