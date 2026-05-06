// Customer Service - Connected to Backend API
import axiosInstance from "@/lib/axios";

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  type: "online" | "offline";
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: "completed" | "pending" | "cancelled";
  deliveryAddress?: string;
  storeName?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  joinedDate: string;
  totalOrders: number;
  onlineSpend: number;
  offlineSpend: number;
  totalLifetimeValue: number;
  orders: CustomerOrder[];
  addresses?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform customer data from backend API response
 */
const transformCustomerData = (data: Record<string, unknown>): Customer => ({
  id: (data.id as string) || "",
  name: (data.name as string) || "",
  email: (data.email as string) || "",
  phone: (data.phoneNumber as string) || (data.phone as string) || "",
  image: (data.image as string) || undefined,
  createdAt: (data.createdAt as string) || new Date().toISOString(),
  updatedAt: (data.updatedAt as string) || new Date().toISOString(),
  joinedDate: (data.createdAt as string) || new Date().toISOString(),
  totalOrders: (data.totalOrders as number) || 0,
  onlineSpend: 0,
  offlineSpend: 0,
  totalLifetimeValue: (data.totalSpent as number) || 0,
  orders: [],
  addresses: [],
});

// Customer Service API - Real Backend Integration
export const customerService = {
  // Get all customers with pagination
  getAll: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await axiosInstance.get("/api/customer/customers", {
        params,
      });

      if (response.data.success) {
        return {
          customers: response.data.data.map((c: Record<string, unknown>) =>
            transformCustomerData(c)
          ),
          pagination: response.data.pagination,
        };
      }
      throw new Error("Failed to fetch customers");
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Get customer by ID
  getById: async (id: string): Promise<Customer | null> => {
    try {
      const response = await axiosInstance.get(`/api/customer/customers/${id}`);
      if (response.data.success) {
        return transformCustomerData(response.data.data);
      }
      throw new Error("Customer not found");
    } catch (error) {
      console.error("Error fetching customer:", error);
      return null;
    }
  },

  // Get customer order history
  getOrders: async (
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    customer: Customer;
    orders: Record<string, unknown>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    try {
      const response = await axiosInstance.get(
        `/api/customer/customers/${id}/orders`,
        {
          params: { page, limit },
        }
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch customer orders");
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw error;
    }
  },

  // Get customer analytics
  getAnalytics: async (
    id: string
  ): Promise<{
    customer: Customer;
    analytics: {
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: string | null;
      averageOrderValue: number;
      recentOrders: Record<string, unknown>[];
    };
  }> => {
    try {
      const response = await axiosInstance.get(
        `/api/customer/customers/${id}/analytics`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch customer analytics");
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      throw error;
    }
  },

  // Search customers
  search: async (query: string): Promise<Customer[]> => {
    try {
      const response = await axiosInstance.get(
        "/api/customer/customers/search",
        {
          params: { q: query },
        }
      );
      if (response.data.success) {
        return response.data.data.map((c: Record<string, unknown>) =>
          transformCustomerData(c)
        );
      }
      throw new Error("Search failed");
    } catch (error) {
      console.error("Error searching customers:", error);
      return [];
    }
  },

  // Get customer statistics
  getStats: async () => {
    try {
      const response = await axiosInstance.get("/api/customer/customers/stats");
      if (response.data.success) {
        const stats = response.data.data;
        // Add default values for order-related stats
        return {
          ...stats,
          totalRevenue: stats.totalRevenue || 0,
        };
      }
      throw new Error("Failed to fetch stats");
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        verifiedCustomers: 0,
        inactiveCustomers: 0,
        unverifiedCustomers: 0,
        localProviderCount: 0,
        googleProviderCount: 0,
        totalRevenue: 0,
      };
    }
  },

  // Get customer's online orders
  getOnlineOrders: async (
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    customerId: string;
    customerName: string;
    orders: Record<string, unknown>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    try {
      const response = await axiosInstance.get(
        `/api/customer/online-orders/customer/${customerId}`,
        {
          params: { page, limit },
        }
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch customer online orders");
    } catch (error) {
      console.error("Error fetching customer online orders:", error);
      throw error;
    }
  },
};
