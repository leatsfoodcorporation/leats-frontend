import axiosInstance from "@/lib/axios";

export interface CustomerAddress {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  userId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressType?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  userId: string;
  name?: string;
  phone?: string;
  alternatePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  addressType?: string;
  isDefault?: boolean;
}

class AddressService {
  private baseURL = "/api/online/addresses";

  /**
   * Get all addresses for user
   */
  async getAddresses(userId: string): Promise<{
    success: boolean;
    data: CustomerAddress[];
  }> {
    const response = await axiosInstance.get(this.baseURL, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Get address by ID
   */
  async getAddressById(
    id: string,
    userId: string
  ): Promise<{
    success: boolean;
    data: CustomerAddress;
  }> {
    const response = await axiosInstance.get(`${this.baseURL}/${id}`, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Create new address
   */
  async createAddress(data: CreateAddressRequest): Promise<{
    success: boolean;
    data: CustomerAddress;
    message: string;
  }> {
    const response = await axiosInstance.post(this.baseURL, data);
    return response.data;
  }

  /**
   * Update address
   */
  async updateAddress(
    id: string,
    data: UpdateAddressRequest
  ): Promise<{
    success: boolean;
    data: CustomerAddress;
    message: string;
  }> {
    const response = await axiosInstance.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete address
   */
  async deleteAddress(
    id: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}`, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(
    id: string,
    userId: string
  ): Promise<{
    success: boolean;
    data: CustomerAddress;
    message: string;
  }> {
    const response = await axiosInstance.patch(
      `${this.baseURL}/${id}/default`,
      { userId }
    );
    return response.data;
  }
}

export const addressService = new AddressService();

// Export individual functions for backward compatibility with old signature
export const getAddresses = (userId: string) => addressService.getAddresses(userId);
export const getAddressById = (id: string, userId: string) => addressService.getAddressById(id, userId);
export const createAddress = (userId: string, data: Omit<CreateAddressRequest, 'userId'>) => 
  addressService.createAddress({ ...data, userId });
export const updateAddress = (userId: string, id: string, data: Omit<UpdateAddressRequest, 'userId'>) => 
  addressService.updateAddress(id, { ...data, userId });
export const deleteAddress = (id: string, userId: string) => addressService.deleteAddress(id, userId);
export const setDefaultAddress = (userId: string, addressId: string) => addressService.setDefaultAddress(addressId, userId);

// Export type alias for Address
export type Address = CustomerAddress;
