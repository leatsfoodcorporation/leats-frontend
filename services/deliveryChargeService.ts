import axiosInstance from "@/lib/axios";

export interface DeliveryChargeRule {
  id: string;
  minOrderValue: number;
  chargeAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryChargeResponse {
  success: boolean;
  data: DeliveryChargeRule | null;
  message?: string;
}

export interface DeliveryChargesResponse {
  success: boolean;
  data: DeliveryChargeRule[];
  message?: string;
}

/**
 * Get all delivery charge settings (Admin)
 */
export const getAllDeliveryCharges = async (): Promise<DeliveryChargeRule[]> => {
  const response = await axiosInstance.get<DeliveryChargesResponse>(
    "/api/settings/delivery-charges"
  );
  return response.data.data;
};;

/**
 * Create delivery charge rule (Admin)
 */
export const createDeliveryCharge = async (
  data: Omit<DeliveryChargeRule, "id" | "createdAt" | "updatedAt">
): Promise<DeliveryChargeRule> => {
  const response = await axiosInstance.post<DeliveryChargeResponse>(
    "/api/settings/delivery-charges",
    data
  );
  if (!response.data.data) {
    throw new Error(response.data.message || "Failed to create delivery charge");
  }
  return response.data.data;
};

/**
 * Update delivery charge rule (Admin)
 */
export const updateDeliveryCharge = async (
  id: string,
  data: Partial<Omit<DeliveryChargeRule, "id" | "createdAt" | "updatedAt">>
): Promise<DeliveryChargeRule> => {
  const response = await axiosInstance.put<DeliveryChargeResponse>(
    `/api/settings/delivery-charges/${id}`,
    data
  );
  if (!response.data.data) {
    throw new Error(response.data.message || "Failed to update delivery charge");
  }
  return response.data.data;
};

/**
 * Delete delivery charge rule (Admin)
 */
export const deleteDeliveryCharge = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/settings/delivery-charges/${id}`);
};

/**
 * Get active delivery charges (Public - for cart/checkout)
 * Returns all active rules ordered by minOrderValue descending
 */
export const getActiveDeliveryCharges = async (): Promise<DeliveryChargeRule[]> => {
  const response = await axiosInstance.get<DeliveryChargesResponse>(
    "/api/settings/delivery-charges/active"
  );
  return response.data.data;
};
