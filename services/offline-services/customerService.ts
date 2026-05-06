import axiosInstance from "@/lib/axios";

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  image?: string | null;
  isVerified?: boolean;
  provider?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerSearchParams {
  q?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerCreateData {
  name: string;
  phoneNumber: string;
}

export interface CustomerResponse {
  success: boolean;
  data: Customer;
  message?: string;
  isExisting?: boolean;
}

export interface CustomersListResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class CustomerService {
  private baseUrl = "/api/customer/customers";

  /**
   * Get all customers with optional search and pagination
   */
  async getAllCustomers(params?: CustomerSearchParams): Promise<CustomersListResponse> {
    try {
      const response = await axiosInstance.get(this.baseUrl, { params });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch customers");
    }
  }

  /**
   * Search customers by name, email, or phone
   */
  async searchCustomers(query: string): Promise<CustomersListResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/search`, {
        params: { q: query },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error searching customers:", error);
      throw new Error(error.response?.data?.message || "Failed to search customers");
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<CustomerResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch customer");
    }
  }

  /**
   * Get customer by phone number
   */
  async getCustomerByPhone(phoneNumber: string): Promise<CustomerResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/phone/${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching customer by phone:", error);
      throw new Error(error.response?.data?.message || "Customer not found");
    }
  }

  /**
   * Create new customer (POS)
   */
  async createCustomer(data: CustomerCreateData): Promise<CustomerResponse> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating customer:", error);
      throw new Error(error.response?.data?.message || "Failed to create customer");
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<any> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching customer stats:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch customer statistics");
    }
  }
}

export const customerService = new CustomerService();
