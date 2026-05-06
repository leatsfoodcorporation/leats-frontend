import axiosInstance from "@/lib/axios";

export interface PageSEO {
  id: string | null;
  pagePath: string;
  pageName: string;
  description: string | null;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string | null;
  isActive: boolean;
}

// Get SEO data for a specific page
export const getPageSEO = async (pagePath: string): Promise<PageSEO | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.leats.in';
    
    console.log(`[SEO Service] Fetching SEO for ${pagePath} from ${apiUrl}`);
    
    // For root path, fetch all and filter (workaround for Express encoded slash issue)
    if (pagePath === '/') {
      const response = await fetch(`${apiUrl}/api/web/seo`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.log(`[SEO Service] Failed to fetch SEO data`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const homeSEO = data.data.find((seo: PageSEO) => seo.pagePath === '/');
        if (homeSEO) {
          console.log(`[SEO Service] ✅ Found home page SEO:`, homeSEO.metaTitle);
          return homeSEO;
        }
      }
      
      console.log(`[SEO Service] No SEO data for home page`);
      return null;
    }
    
    // For other paths, use the direct endpoint
    const encodedPath = encodeURIComponent(pagePath);
    const response = await fetch(`${apiUrl}/api/web/seo/page/${encodedPath}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`[SEO Service] No data for ${pagePath}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`[SEO Service] ✅ Got SEO for ${pagePath}`);
      return data.data;
    }
    return null;
  } catch (error) {
    console.error(`[SEO Service] Error for ${pagePath}:`, error);
    return null;
  }
};

// Get all page SEO data
export const getAllPageSEO = async (): Promise<PageSEO[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.leats.in';
    
    console.log(`[SEO Service] Fetching all SEO from ${apiUrl}`);
    
    const response = await fetch(`${apiUrl}/api/web/seo`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log('[SEO Service] No SEO data available');
      return [];
    }
    
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("[SEO Service] Error fetching all page SEO:", error);
    return [];
  }
};

export interface SEOGenerationParams {
  productName: string;
  category?: string;
  brand?: string;
}

export interface SEOGenerationResponse {
  success: boolean;
  data: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
}

/**
 * Generate SEO content for a product using AI
 */
export const generateSEO = async (params: SEOGenerationParams): Promise<SEOGenerationResponse> => {
  const response = await axiosInstance.post("/api/online/online-products/generate-seo", params);
  return response.data;
};
