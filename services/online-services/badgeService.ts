import axiosInstance from "@/lib/axios";

export interface Badge {
  id: string;
  name: string;
  isStatic: boolean;
  sortOrder: number;
  enabledForHomepage: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BadgeResponse {
  success: boolean;
  data: {
    static: Badge[];
    custom: Badge[];
    all: Badge[];
  };
  message?: string;
}

export interface SingleBadgeResponse {
  success: boolean;
  data?: Badge;
  message?: string;
  conflict?: boolean;
  conflictBadge?: {
    id: string;
    name: string;
    sortOrder: number;
  };
  requiresConfirmation?: boolean;
  swapped?: boolean;
}

export const badgeService = {
  // Get all badges (static + custom)
  getAllBadges: async (): Promise<BadgeResponse> => {
    const response = await axiosInstance.get("/api/online/badges");
    return response.data;
  },

  // Create custom badge
  createBadge: async (name: string, sortOrder?: number, enabledForHomepage?: boolean): Promise<SingleBadgeResponse> => {
    const response = await axiosInstance.post("/api/online/badges", { name, sortOrder, enabledForHomepage });
    return response.data;
  },

  // Update badge (both static and custom)
  updateBadge: async (id: string, name: string, sortOrder?: number, enabledForHomepage?: boolean, confirmSwap?: boolean): Promise<SingleBadgeResponse> => {
    try {
      const response = await axiosInstance.put(`/api/online/badges/${id}`, { name, sortOrder, enabledForHomepage, confirmSwap }, {
        validateStatus: (status) => {
          // Treat 409 as a valid response (not an error) so it doesn't log to console
          return (status >= 200 && status < 300) || status === 409;
        }
      });
      return response.data;
    } catch (error) {
      // This will only catch network errors or other unexpected errors
      throw error;
    }
  },

  // Reset static badge to default
  resetStaticBadge: async (id: string): Promise<SingleBadgeResponse> => {
    const response = await axiosInstance.post(`/api/online/badges/${id}/reset`);
    return response.data;
  },

  // Delete custom badge
  deleteBadge: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/online/badges/${id}`);
    return response.data;
  },
};
