import axiosInstance from "@/lib/axios";

export interface WebSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  logoKey: string | null;
  faviconKey: string | null;
}

export interface WebSettingsResponse {
  success: boolean;
  data: WebSettings;
}

/**
 * Get web settings (logo and favicon) from backend
 */
export const getPurchaseWebSettings = async (): Promise<WebSettingsResponse> => {
  try {
    const response = await axiosInstance.get<WebSettingsResponse>(
      "/api/web/web-settings"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching web settings:", error);
    // Return default values on error
    return {
      success: false,
      data: {
        logoUrl: null,
        faviconUrl: null,
        logoKey: null,
        faviconKey: null,
      },
    };
  }
};
