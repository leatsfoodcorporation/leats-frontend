import axiosInstance from "@/lib/axios";

export interface Policy {
  id: string | null;
  policyType: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  isPublished: boolean;
  version: number;
  lastUpdated: string | null;
}

// Get published policy by slug (for public pages)
export const getPublishedPolicy = async (slug: string): Promise<Policy | null> => {
  try {
    const response = await axiosInstance.get(`/api/web/policies/public/${slug}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching policy:", error);
    return null;
  }
};

// Get all policies (for admin)
export const getAllPolicies = async (): Promise<Policy[]> => {
  try {
    const response = await axiosInstance.get("/api/web/policies");
    
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching policies:", error);
    return [];
  }
};

// Get policy by type (for admin)
export const getPolicyByType = async (type: string): Promise<Policy | null> => {
  try {
    const response = await axiosInstance.get(`/api/web/policies/type/${type}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching policy:", error);
    return null;
  }
};
