import axiosInstance from "@/lib/axios";

export interface GSTRate {
  id: string;
  name: string;
  gstPercentage: number;
  isActive: boolean;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GSTRateResponse {
  success: boolean;
  data: GSTRate[];
  count: number;
}

class GSTRateService {
  private baseURL = "/api/finance/gst-rates";

  /**
   * Get all active GST rates
   */
  async getActiveGSTRates(): Promise<GSTRateResponse> {
    try {
      const response = await axiosInstance.get(this.baseURL, {
        params: { isActive: true },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching GST rates:", error);
      throw error;
    }
  }

  /**
   * Get all GST rates (including inactive)
   */
  async getAllGSTRates(): Promise<GSTRateResponse> {
    try {
      const response = await axiosInstance.get(this.baseURL);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching GST rates:", error);
      throw error;
    }
  }
}

export const gstRateService = new GSTRateService();
