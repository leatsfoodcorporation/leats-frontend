import axiosInstance from './axios';

/**
 * Get device information (browser, OS, etc.)
 */
const getDeviceInfo = (): string => {
  if (typeof window === 'undefined') return 'Unknown Device';
  
  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
};

/**
 * Save FCM token to backend (with device info for multi-device support)
 */
export const saveFCMToken = async (
  userId: string,
  fcmToken: string,
  userType: 'user' | 'admin' | 'employee'
): Promise<{ success: boolean; message?: string; totalDevices?: number }> => {
  try {
    // ✅ Check if token is already saved for this user
    const savedTokenKey = `fcm_token_${userId}_${userType}`;
    const savedToken = localStorage.getItem(savedTokenKey);
    
    if (savedToken === fcmToken) {
      console.log('✅ FCM token already saved for this user, skipping...');
      return { success: true, totalDevices: 1 };
    }

    const deviceInfo = getDeviceInfo();
    
    const response = await axiosInstance.post('/api/auth/fcm-token', {
      userId,
      fcmToken,
      userType,
      deviceInfo, // Send device info for tracking
    });

    if (response.data.success) {
      const totalDevices = response.data.data?.totalDevices || 1;
      console.log(`✅ FCM token saved to backend - Total devices: ${totalDevices}`);
      console.log(`📱 Device: ${deviceInfo}`);
      
      // ✅ Cache the token to prevent duplicate saves
      localStorage.setItem(savedTokenKey, fcmToken);
      
      return { success: true, totalDevices };
    } else {
      console.error('❌ Failed to save FCM token:', response.data.error);
      return { success: false, message: response.data.error };
    }
  } catch (error: any) {
    console.error('❌ Error saving FCM token:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Remove FCM token from backend (on logout from specific device)
 */
export const removeFCMToken = async (
  userId: string,
  userType: 'user' | 'admin' | 'employee',
  fcmToken?: string // Optional: remove specific token, or all if not provided
): Promise<{ success: boolean; message?: string }> => {
  try {
    const data: any = { userId, userType };
    
    // If fcmToken provided, remove only that device
    if (fcmToken) {
      data.fcmToken = fcmToken;
      console.log('🔓 Logging out from current device only');
    } else {
      console.log('🔓 Logging out from ALL devices');
    }

    const response = await axiosInstance.delete('/api/auth/fcm-token', {
      data,
    });

    if (response.data.success) {
      console.log('✅ FCM token removed from backend');
      // ✅ Clear cached token from localStorage
      const savedTokenKey = `fcm_token_${userId}_${userType}`;
      localStorage.removeItem(savedTokenKey);
      return { success: true };
    } else {
      console.error('❌ Failed to remove FCM token:', response.data.error);
      return { success: false, message: response.data.error };
    }
  } catch (error: any) {
    console.error('❌ Error removing FCM token:', error.message);
    return { success: false, message: error.message };
  }
};
