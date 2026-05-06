import axiosInstance from "@/lib/axios";

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryFormData {
  name: string;
  description?: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const expenseCategoryService = {
  // Get all expense categories
  getAll: async (filters?: { isActive?: boolean }): Promise<ExpenseCategory[]> => {
    const response = await axiosInstance.get<ApiResponse<ExpenseCategory[]>>(
      "/api/purchase/expense-categories",
      { params: filters }
    );
    return response.data.data;
  },

  // Get expense category by ID
  getById: async (id: string): Promise<ExpenseCategory> => {
    const response = await axiosInstance.get<ApiResponse<ExpenseCategory>>(
      `/api/purchase/expense-categories/${id}`
    );
    return response.data.data;
  },

  // Get category names (for dropdowns)
  getCategoryNames: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get<
      ApiResponse<{ id: string; name: string }[]>
    >("/api/purchase/expense-categories/names");
    return response.data.data;
  },

  // Create expense category
  create: async (
    data: ExpenseCategoryFormData
  ): Promise<{ data: ExpenseCategory; message: string }> => {
    const response = await axiosInstance.post<ApiResponse<ExpenseCategory>>(
      "/api/purchase/expense-categories",
      data
    );
    return {
      data: response.data.data,
      message: response.data.message || "Expense category created successfully",
    };
  },

  // Update expense category
  update: async (
    id: string,
    data: ExpenseCategoryFormData
  ): Promise<{ data: ExpenseCategory; message: string }> => {
    const response = await axiosInstance.put<ApiResponse<ExpenseCategory>>(
      `/api/purchase/expense-categories/${id}`,
      data
    );
    return {
      data: response.data.data,
      message: response.data.message || "Expense category updated successfully",
    };
  },

  // Delete expense category
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `/api/purchase/expense-categories/${id}`
    );
    return {
      message: response.data.message || "Expense category deleted successfully",
    };
  },
};
