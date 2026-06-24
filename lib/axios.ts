import axios from "axios";
import { toast } from "sonner";

// For server-side rendering, we need the full URL
// For client-side, we can use relative URLs or the public URL
const getBaseURL = () => {
  // Server-side: use the internal service URL or fallback to localhost
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }
  // Client-side: use the public API URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
};

const API_URL = getBaseURL();

// Single axios instance - all requests go through API Gateway on port 5000
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased to 30 seconds for registration/email operations
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    // But we still support Authorization header for backward compatibility
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
 
// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only access localStorage on client-side
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("fcm_token");

        const isLogoutRequest = error.config?.url?.includes("/logout");
        if (!isLogoutRequest) {
          window.dispatchEvent(
            new CustomEvent("auth-failure", {
              detail: { reason: "unauthorized" },
            })
          );
        }
      }
    }

    // 403 Forbidden — permission denied
    // Return empty success response so components don't crash or show duplicate error toasts
    // The PagePermissionGate already shows "Access Denied" on the page
    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        const isUserAction = ["post", "put", "patch", "delete"].includes(error.config?.method?.toLowerCase() || "");
        if (isUserAction) {
          // User-initiated action (save, delete, etc.) — show toast
          const msg = error.response?.data?.error || "You don't have permission for this action";
          toast.error("Access Denied", { description: msg, id: "permission-denied" });
        }
        // GET requests (page load data fetches) — silent, PagePermissionGate handles UI
      }
      // Return empty response so component catch blocks don't fire
      return { data: { success: false, data: [], error: "Permission denied" }, status: 403 };
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
