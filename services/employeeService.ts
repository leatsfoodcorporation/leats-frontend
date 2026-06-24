import axiosInstance from "@/lib/axios";
import type { EmployeesResponse, EmployeeResponse } from "@/types/employee";

export const employeeService = {
  getEmployees: async (params?: Record<string, string | number>): Promise<EmployeesResponse> => {
    const response = await axiosInstance.get("/api/employees", { params });
    return response.data;
  },

  getEmployeeById: async (id: string): Promise<EmployeeResponse> => {
    const response = await axiosInstance.get(`/api/employees/${id}`);
    return response.data;
  },

  createEmployee: async (formData: FormData): Promise<EmployeeResponse> => {
    const response = await axiosInstance.post("/api/employees", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateEmployee: async (id: string, formData: FormData): Promise<EmployeeResponse> => {
    const response = await axiosInstance.put(`/api/employees/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateStatus: async (id: string, data: { status: string; suspensionReason?: string; suspensionNote?: string }): Promise<EmployeeResponse> => {
    const response = await axiosInstance.put(`/api/employees/${id}/status`, data);
    return response.data;
  },

  assignRole: async (id: string, roleId: string): Promise<EmployeeResponse> => {
    const response = await axiosInstance.put(`/api/employees/${id}/assign-role`, { roleId });
    return response.data;
  },

  resendInvitation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post(`/api/employees/${id}/resend-invitation`);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/employees/${id}`);
    return response.data;
  },

  // Auth
  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post("/api/auth/employee/verify-email", { token });
    return response.data;
  },
};
