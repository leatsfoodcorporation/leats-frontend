import axiosInstance from "@/lib/axios";
import type { RolesResponse, RoleResponse, PermissionModulesResponse } from "@/types/employee";

export const roleService = {
  getPermissionModules: async (): Promise<PermissionModulesResponse> => {
    const response = await axiosInstance.get("/api/roles/modules");
    return response.data;
  },

  getRoles: async (params?: Record<string, string>): Promise<RolesResponse> => {
    const response = await axiosInstance.get("/api/roles", { params });
    return response.data;
  },

  getRoleById: async (id: string): Promise<RoleResponse> => {
    const response = await axiosInstance.get(`/api/roles/${id}`);
    return response.data;
  },

  createRole: async (data: { name: string; description?: string; permissions: { module: string; actions: string[] }[] }): Promise<RoleResponse> => {
    const response = await axiosInstance.post("/api/roles", data);
    return response.data;
  },

  updateRole: async (id: string, data: { name?: string; description?: string; permissions?: { module: string; actions: string[] }[]; isActive?: boolean }): Promise<RoleResponse> => {
    const response = await axiosInstance.put(`/api/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/roles/${id}`);
    return response.data;
  },
};
