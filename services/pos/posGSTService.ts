import axiosInstance from "@/lib/axios";

/**
 * POS GST Rate Service
 * GST rates are from finance service
 * Route: /api/finance/gst-rates
 */

export interface GSTRate {
  id: string;
  name: string;
  gstPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GSTRateListResponse {
  success: boolean;
  data: GSTRate[];
}

class POSGSTService {
  private baseURL = "/api/finance/gst-rates";

  /**
   * Get all active GST rates
   */
  async getActiveGSTRates(): Promise<GSTRateListResponse> {
    const response = await axiosInstance.get(this.baseURL, {
      params: { isActive: true },
    });
    return response.data;
  }

  /**
   * Get all GST rates
   */
  async getAllGSTRates(): Promise<GSTRateListResponse> {
    const response = await axiosInstance.get(this.baseURL);
    return response.data;
  }
}

export const posGSTService = new POSGSTService();
