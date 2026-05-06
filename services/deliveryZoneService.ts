import axiosInstance from '@/lib/axios';

export interface DeliveryZone {
  id: string;
  country: string;
  state: string;
  city: string;
  pincodes: string[];
  isActive: boolean;
  isAllPincodes: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PincodeCheckResult {
  success: boolean;
  serviceable: boolean;
  message: string;
  data: {
    city: string;
    state: string;
    country: string;
    pincode: string;
    area?: string;
  } | null;
}

// Admin: Get all delivery zones
export const getAllDeliveryZones = async (): Promise<DeliveryZone[]> => {
  const response = await axiosInstance.get('/api/delivery-zones');
  return response.data.data;
};

// Admin: Create a new delivery zone
export const createDeliveryZone = async (data: {
  country: string;
  state: string;
  city: string;
  pincodes: string[];
  isActive?: boolean;
  isAllPincodes?: boolean;
} | any): Promise<DeliveryZone> => {
  const response = await axiosInstance.post('/api/delivery-zones', data);
  return response.data.data;
};

// Admin: Update a delivery zone
export const updateDeliveryZone = async (
  id: string,
  data: Partial<{
    country: string;
    state: string;
    city: string;
    pincodes: string[];
    isActive: boolean;
    isAllPincodes: boolean;
  }>
): Promise<DeliveryZone> => {
  const response = await axiosInstance.put(`/api/delivery-zones/${id}`, data);
  return response.data.data;
};

// Admin: Delete a delivery zone
export const deleteDeliveryZone = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/delivery-zones/${id}`);
};

// Public: Check if a pincode is serviceable
export const checkPincodeServiceability = async (
  pincode: string,
  country?: string,
  city?: string | null,
  state?: string | null
): Promise<PincodeCheckResult> => {
  const params: any = {};
  if (country) params.country = country;
  if (city) params.city = city;
  if (state) params.state = state;
  
  const response = await axiosInstance.get(`/api/delivery-zones/check/${pincode}`, { params });
  return response.data;
};

// Public: Get list of countries with active zones
export const getAvailableCountries = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/delivery-zones/countries');
  return response.data.data;
};

// Admin: Discover/Verify pincodes using AI (Groq)
export const discoverPincodesAI = async (data: {
  city: string;
  state: string;
  country?: string;
}): Promise<{
  city: string;
  state: string;
  pincodes: string[];
  count: number;
}> => {
  const response = await axiosInstance.post('/api/delivery-zones/discover-ai', data);
  return response.data.data;
};

// Public: Detect location by coordinates (AI reverse geocoding)
export const detectLocationByCoords = async (lat: number, lng: number): Promise<PincodeCheckResult> => {
  const response = await axiosInstance.post('/api/delivery-zones/detect-location', { lat, lng });
  return response.data;
};
