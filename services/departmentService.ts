import axiosInstance from "@/lib/axios";
import type { DepartmentsResponse, DepartmentResponse } from "@/types/employee";

export const departmentService = {
  getDepartments: async (params?: Record<string, string>): Promise<DepartmentsResponse> => {
    const response = await axiosInstance.get("/api/departments", { params });
    return response.data;
  },

  getDepartmentById: async (id: string): Promise<DepartmentResponse> => {
    const response = await axiosInstance.get(`/api/departments/${id}`);
    return response.data;
  },

  createDepartment: async (data: { name: string; description?: string }): Promise<DepartmentResponse> => {
    const response = await axiosInstance.post("/api/departments", data);
    return response.data;
  },

  updateDepartment: async (id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<DepartmentResponse> => {
    const response = await axiosInstance.put(`/api/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/departments/${id}`);
    return response.data;
  },
};
