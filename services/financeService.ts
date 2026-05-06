import axiosInstance from '@/lib/axios';

// Types for finance service responses
export interface SalesItem {
  id: string;
  productId: string;
  inventoryProductId?: string;
  productName: string;
  variantName?: string;
  displayName?: string;
  brand?: string;
  productImage?: string;
  selectedCuttingStyle?: string;
  unitPrice: number;
  mrp?: number;
  quantity: number;
  discount: number;
  subtotal: number;
  itemTotal?: number;
  totalAmount: number;
  total?: number;
  totalPrice?: number;
  gstPercentage: number;
  gstAmount: number;
  totalGstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
  priceBeforeGst: number;
  revenueAmount: number;
  // UOM fields for proper quantity display
  variantUom?: string | null;
  variantUomValue?: number | null;
}

export interface Transaction {
  id: string;
  transactionId: string;
  transactionType: string;
  referenceType: string;
  referenceId?: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  netAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  paymentGateway?: string;
  gatewayTransactionId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  accountingPeriod?: string;
  financialYear?: string;
  transactionDate: string;
  revenueAmount: number;
  revenueRecognitionDate?: string;
  revenueRecognitionReason?: string;
  description?: string;
  notes?: string;
  source?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: string;
  transactionType?: string;
  accountingPeriod?: string;
  financialYear?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  orderType: 'pos' | 'online';
  source: 'POS' | 'Online';
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  subtotal: number;
  tax: number; // Changed from taxAmount
  taxRate: number;
  discount: number;
  // POS-specific fields
  roundingOff?: number;
  amountReceived?: number;
  changeGiven?: number;
  createdBy?: string;
  // Online-specific fields
  couponCode?: string;
  couponDiscount?: number;
  shippingCharge?: number;
  // GST Breakdown
  gstType?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGstAmount?: number;
  adminState?: string;
  customerState?: string;
  total: number; // Changed from totalAmount
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'completed';
  paymentId?: string;
  orderStatus: string;
  accountingPeriod: string;
  financialYear: string;
  saleDate: string;
  createdAt: string;
  itemCount: number;
  totalQuantity: number;
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  orderType?: 'pos' | 'online';
  financialYear?: string;
  accountingPeriod?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentMethod?: string;
}

export interface SalesResponse {
  success: boolean;
  data: SalesOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalOrders: number;
    posOrders: number;
    onlineOrders: number;
    totalRevenue: number;
    totalAmount: number;
  };
}

export interface FinancialYearData {
  financialYear: string;
  totalOrders: number;
  totalAmount: number;
  posOrders: number;
  posAmount: number;
  onlineOrders: number;
  onlineAmount: number;
}

export interface OrderDetails extends SalesOrder {
  items: SalesItem[];
  // GST Breakdown fields
  gstType?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGstAmount?: number;
  adminState?: string;
  customerState?: string;
}

class FinanceService {
  /**
   * Get all sales (POS + Online orders)
   */
  async getAllSales(filters: SalesFilters = {}): Promise<SalesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axiosInstance.get(`/api/finance/sales?${params.toString()}`);
    return response.data;
  }

  /**
   * Get sales by financial year
   */
  async getSalesByFinancialYear(): Promise<{ success: boolean; data: FinancialYearData[] }> {
    const response = await axiosInstance.get('/api/finance/sales/by-year');
    return response.data;
  }

  /**
   * Get order details by ID and type
   */
  async getOrderDetails(type: 'pos' | 'online', id: string): Promise<{ success: boolean; data: OrderDetails }> {
    const response = await axiosInstance.get(`/api/finance/sales/${type}/${id}`);
    return response.data;
  }

  /**
   * Get all transactions
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<TransactionResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axiosInstance.get(`/api/finance/transactions?${params.toString()}`);
    return response.data;
  }
}

export const financeService = new FinanceService();
export default financeService;