import axiosInstance from "@/lib/axios";

export interface Expense {
  id: string;
  expenseNumber: string;
  categoryId: string;
  categoryName: string;
  expense: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  supplierId?: string;
  supplierName?: string;
  receiptUrl?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface ExpenseFormData {
  expenseNumber?: string;
  categoryId: string;
  expense: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  supplierId?: string;
  supplierName?: string;
  receiptUrl?: string;
  status: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const expenseService = {
  // Get all expenses
  getAll: async (filters?: {
    categoryId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> => {
    const response = await axiosInstance.get<ApiResponse<Expense[]>>(
      "/api/purchase/expenses",
      { params: filters }
    );
    return response.data.data;
  },

  // Get expense by ID
  getById: async (id: string): Promise<Expense> => {
    const response = await axiosInstance.get<ApiResponse<Expense>>(
      `/api/purchase/expenses/${id}`
    );
    return response.data.data;
  },

  // Get next expense number
  getNextExpenseNumber: async (): Promise<string> => {
    const response = await axiosInstance.get<
      ApiResponse<{ expenseNumber: string }>
    >("/api/purchase/expenses/next-number");
    return response.data.data.expenseNumber;
  },

  // Create expense
  create: async (
    data: ExpenseFormData
  ): Promise<{ data: Expense; message: string }> => {
    const response = await axiosInstance.post<ApiResponse<Expense>>(
      "/api/purchase/expenses",
      data
    );
    return {
      data: response.data.data,
      message: response.data.message || "Expense created successfully",
    };
  },

  // Update expense
  update: async (
    id: string,
    data: ExpenseFormData
  ): Promise<{ data: Expense; message: string }> => {
    const response = await axiosInstance.put<ApiResponse<Expense>>(
      `/api/purchase/expenses/${id}`,
      data
    );
    return {
      data: response.data.data,
      message: response.data.message || "Expense updated successfully",
    };
  },

  // Get expense statistics
  getStats: async () => {
    const response = await axiosInstance.get("/api/purchase/expenses/stats");
    return response.data.data;
  },

  // Get expenses by category
  getByCategory: async (categoryId: string): Promise<Expense[]> => {
    const response = await axiosInstance.get<ApiResponse<Expense[]>>(
      `/api/purchase/expenses/category/${categoryId}`
    );
    return response.data.data;
  },

  // Upload receipt
  uploadReceipt: async (file: File): Promise<{ receiptUrl: string }> => {
    const formData = new FormData();
    formData.append("receipt", file);

    const response = await axiosInstance.post<
      ApiResponse<{ receiptUrl: string }>
    >("/api/purchase/expenses/upload-receipt", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};
