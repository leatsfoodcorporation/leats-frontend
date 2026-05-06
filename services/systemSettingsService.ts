import axiosInstance from '@/lib/axios';

export interface SystemSettings {
  defaultCountry: string;
  defaultCurrency: string;
}

let cachedSettings: SystemSettings | null = null;

export const getSystemSettings = async (): Promise<SystemSettings> => {
  // Return cached settings if available
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    // Fetch admin's settings to get default country
    const response = await axiosInstance.get('/api/auth/admin/settings');
    
    if (response.data.success) {
      cachedSettings = {
        defaultCountry: response.data.data.country || '',
        defaultCurrency: response.data.data.currency || 'INR',
      };
      return cachedSettings;
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
  }

  // Return empty settings if fetch fails
  return {
    defaultCountry: '',
    defaultCurrency: 'INR',
  };
};

// Clear cache when needed (e.g., when admin updates settings)
export const clearSystemSettingsCache = () => {
  cachedSettings = null;
};
