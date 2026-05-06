import axiosInstance from "@/lib/axios";

export interface BarcodeGenerateResponse {
  success: boolean;
  data: {
    barcode: string;
    format: string;
  };
  message?: string;
}

export interface BarcodeValidateResponse {
  success: boolean;
  data: {
    valid: boolean;
    unique: boolean;
    message: string;
  };
  message?: string;
}

export const barcodeService = {
  // Generate unique barcode for POS products
  generateBarcode: async (): Promise<BarcodeGenerateResponse> => {
    const response = await axiosInstance.post("/api/pos/barcodes/generate");
    return response.data;
  },

  // Validate barcode for POS products
  validateBarcode: async (barcode: string): Promise<BarcodeValidateResponse> => {
    const response = await axiosInstance.post("/api/pos/barcodes/validate", { barcode });
    return response.data;
  },
};
