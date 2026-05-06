import axiosInstance from "@/lib/axios";

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Purchase Order Item Types
export interface PurchaseOrderItem {
  poId: string;
  poDate: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  grandTotal: number;
  totalQuantity: number;
  totalGST: number;
  totalDiscount: number;
  expectedDeliveryDate?: string;
  itemsCount?: number;
}

// Purchase Summary Report Types
export interface PurchaseSummary {
  totalPOs: number;
  totalAmount: number;
  totalQuantity: number;
  totalGST: number;
  totalDiscount: number;
  byStatus: Record<string, { count: number; amount: number }>;
  bySupplier: Record<string, { count: number; amount: number }>;
  byWarehouse: Record<string, { count: number; amount: number }>;
}

export interface PurchaseSummaryReport {
  summary: PurchaseSummary;
  purchaseOrders: PurchaseOrderItem[];
}

// Bill Item Types
export interface BillItem {
  billId: string;
  grnNumber: string;
  supplierInvoiceNo?: string;
  billDate: string;
  receivedDate: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierGSTIN?: string;
  warehouseId: string;
  warehouseName: string;
  paymentStatus: string;

  billDueDate?: string;
  subTotal: number;
  totalQuantity: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount?: number;
  transporterName?: string;
  vehicleNumber?: string;
  eWayBillNumber?: string;
  remarks?: string;
}

// Bills Summary Report Types
export interface BillsSummary {
  totalBills: number;
  totalAmount: number;
  totalQuantity: number;
  totalGST: number;
  totalDiscount: number;
  byPaymentStatus: Record<string, { count: number; amount: number }>;
  bySupplier: Record<string, { count: number; amount: number }>;
  byWarehouse: Record<string, { count: number; amount: number }>;
}

export interface BillsSummaryReport {
  summary: BillsSummary;
  bills: BillItem[];
}

// Expense Item Types
export interface ExpenseItem {
  expenseId: string;
  expenseDate: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  status: string;
  supplierName?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

// Expenses Summary Report Types
export interface ExpensesSummary {
  totalExpenses: number;
  totalAmount: number;
  byStatus: Record<string, { count: number; amount: number }>;
  byCategory: Record<string, { count: number; amount: number }>;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}

export interface ExpensesSummaryReport {
  summary: ExpensesSummary;
  expenses: ExpenseItem[];
}

// Report Filters
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  warehouseId?: string;
  status?: string;
  paymentStatus?: string;
  categoryId?: string;
}

// Report Service
export const reportService = {
  // Purchase Order Reports
  getPurchaseSummary: async (
    filters?: ReportFilters
  ): Promise<PurchaseSummaryReport> => {
    const response = await axiosInstance.get<
      ApiResponse<PurchaseSummaryReport>
    >("/api/purchase/reports/purchase-summary", { params: filters });
    return response.data.data;
  },

  // Bills Reports
  getBillsSummary: async (
    filters?: ReportFilters
  ): Promise<BillsSummaryReport> => {
    const response = await axiosInstance.get<ApiResponse<BillsSummaryReport>>(
      "/api/purchase/reports/bills-summary",
      { params: filters }
    );
    return response.data.data;
  },

  // Expenses Reports
  getExpensesSummary: async (
    filters?: ReportFilters
  ): Promise<ExpensesSummaryReport> => {
    const response = await axiosInstance.get<
      ApiResponse<ExpensesSummaryReport>
    >("/api/purchase/reports/expenses-summary", { params: filters });
    return response.data.data;
  },
};
