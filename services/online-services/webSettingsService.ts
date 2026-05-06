import axiosInstance from "@/lib/axios";

export interface WebSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  logoKey: string | null;
  faviconKey: string | null;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logoUrl: string;
  faviconUrl: string;
  mapIframe: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
}

export interface WebSettingsResponse {
  success: boolean;
  data: WebSettings;
}

export interface CompanySettingsResponse {
  success: boolean;
  data: CompanySettings;
}

/**
 * Get web settings (logo and favicon) from online-service
 */
export const getWebSettings = async (): Promise<WebSettingsResponse> => {
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

/**
 * Get company settings (contact info, social media, etc.)
 */
export const getCompanySettings = async (): Promise<CompanySettingsResponse> => {
  try {
    const response = await axiosInstance.get<CompanySettingsResponse>(
      "/api/web/company"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    // Return default values on error
    return {
      success: false,
      data: {
        companyName: "",
        tagline: "",
        description: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        logoUrl: "",
        faviconUrl: "",
        mapIframe: "",
        socialMedia: {
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: "",
          youtube: "",
        },
      },
    };
  }
};
