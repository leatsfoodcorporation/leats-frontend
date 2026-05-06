import axiosInstance from "@/lib/axios";

// Backend Bill Item structure (from API)
interface BackendBillItem {
  id?: string;
  category: string;
  itemId?: string;
  productName?: string;
  itemName?: string;
  sku?: string;
  itemCode?: string;
  hsnCode?: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
  quantityReceived?: number;
  acceptedQuantity?: number;
  uom: string;
  batchNumber?: string;
  batchNo?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  mfgDate?: string;
  price?: number;
  purchasePrice?: number;
  gstRateId?: string;
  gstPercentage: number;
  gstType: string;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  totalPrice?: number;
  totalAmount?: number;
}

// Bill/GRN Types (Frontend)
export interface BillItem {
  id?: string;
  category: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  hsnCode: string;
  quantityReceived: number;
  uom: string;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  purchasePrice: number;
  gstPercentage: number;
  gstType: "cgst_sgst" | "igst";
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  totalAmount: number;
}

export interface Bill {
  id: string;
  billId: string;
  grnNumber: string;
  invoiceNumber?: string; // Frontend field name
  supplierInvoiceNo?: string; // Backend field name
  grnDate?: string; // Frontend field name
  billDate?: string; // Backend field name
  supplierId: string;
  supplierName: string;
  poId?: string; // Purchase Order ID (database reference)
  poNumber?: string; // Purchase Order Number (e.g., PO-2024-001)

  billDueDate: string;
  // Addresses
  billingAddress?: string;
  shippingAddress?: string;
  warehouseId: string;
  warehouseName: string;
  // Shipment Details
  shipmentReceivedDate?: string; // Frontend field name
  receivedDate?: string; // Backend field name
  deliveryChallanNumber?: string; // Frontend field name
  vehicleNumber?: string; // Backend field name
  transporterName?: string;
  eWayBillNumber?: string;
  remarks?: string;
  invoiceCopy?: string;
  invoiceCopyUrl?: string; // Backend field name
  // Supplier Details
  contactPersonName?: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierGSTIN: string;
  supplierAddress?: string;
  // Items
  items: BackendBillItem[];
  // Summary
  subTotal: number;
  totalDiscount: number;
  discount?: number;
  discountType?: string;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  // Payment
  paymentStatus: "paid" | "unpaid";
  paymentMethod?: string;
  referenceNumber?: string;
  paymentDate?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface BillFormData {
  // GRN/Bill Details
  grnNumber: string;
  invoiceNumber: string;
  grnDate: string;
  supplierId: string;
  supplierName: string;
  poId?: string;

  billDueDate: string;

  // Addresses
  billingAddress: string;
  shippingAddress: string;
  warehouseId: string;
  warehouseName: string;

  // Shipment Details
  shipmentReceivedDate: string;
  deliveryChallanNumber?: string;
  transporterName?: string;
  eWayBillNumber?: string;
  remarks?: string;
  invoiceCopy?: File | string;

  // Supplier Details
  contactPersonName: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierGSTIN: string;
  supplierAddress: string;

  // Items
  items: BillItem[];

  // Summary
  subTotal: number;
  totalDiscount: number;
  discount: number;
  discountType: "flat" | "percentage";
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;

  // Payment
  paymentStatus: "paid" | "unpaid";
  paymentMethod?: string;
  referenceNumber?: string;
  paymentDate?: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

// Bill/GRN Services
export const billService = {
  // Get all bills
  getAll: async (filters?: {
    status?: string;
    supplierId?: string;
    warehouseId?: string;
    poId?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
  }): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      "/api/purchase/bills",
      { params: filters }
    );
    return response.data.data;
  },

  // Get bill by ID
  getById: async (id: string): Promise<BillFormData> => {
    const response = await axiosInstance.get<ApiResponse<Bill>>(
      `/api/purchase/bills/${id}`
    );
    const bill = response.data.data;

    // Helper function to safely split date
    const safeDate = (dateStr: string | undefined | null): string => {
      if (!dateStr) return "";
      return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    };

    // Transform Bill to BillFormData for editing
    return {
      grnNumber: bill.grnNumber || "",
      invoiceNumber: bill.supplierInvoiceNo || bill.invoiceNumber || "",
      grnDate: safeDate(bill.grnDate || bill.billDate) || new Date().toISOString().split("T")[0],
      supplierId: bill.supplierId || "",
      supplierName: bill.supplierName || "",
      poId: bill.poId,
     
      billDueDate: safeDate(bill.billDueDate),
      billingAddress: bill.billingAddress || "",
      shippingAddress: bill.shippingAddress || "",
      warehouseId: bill.warehouseId || "",
      warehouseName: bill.warehouseName || "",
      shipmentReceivedDate:
        safeDate(bill.receivedDate || bill.shipmentReceivedDate) ||
        new Date().toISOString().split("T")[0],
      deliveryChallanNumber: bill.vehicleNumber || bill.deliveryChallanNumber,
      transporterName: bill.transporterName,
      eWayBillNumber: bill.eWayBillNumber,
      remarks: bill.remarks,
      invoiceCopy: bill.invoiceCopyUrl || bill.invoiceCopy,
      contactPersonName: bill.contactPersonName || "",
      supplierPhone: bill.supplierPhone || "",
      supplierEmail: bill.supplierEmail || "",
      supplierGSTIN: bill.supplierGSTIN || "",
      supplierAddress: bill.supplierAddress || "",
      items: (bill.items || []).map((item) => ({
        id: item.id || Date.now().toString() + Math.random(),
        category: item.category || "",
        itemId: item.itemId || "",
        itemName: item.productName || item.itemName || "",
        itemCode: item.sku || item.itemCode || "",
        hsnCode: item.hsnCode || "",
        quantityReceived: item.receivedQuantity || item.quantityReceived || 0,
        uom: item.uom || "PCS",
        batchNo: item.batchNumber || item.batchNo,
        expiryDate: safeDate(item.expiryDate) || undefined,
        mfgDate: safeDate(item.manufacturingDate) || undefined,
        purchasePrice: item.price || item.purchasePrice || 0,
        gstRateId: item.gstRateId,
        gstPercentage: item.gstPercentage || 0,
        gstType: (item.gstType as "cgst_sgst" | "igst") || "cgst_sgst",
        cgstPercentage: item.cgstPercentage || 0,
        sgstPercentage: item.sgstPercentage || 0,
        igstPercentage: item.igstPercentage || 0,
        cgstAmount: item.cgstAmount || 0,
        sgstAmount: item.sgstAmount || 0,
        igstAmount: item.igstAmount || 0,
        totalGstAmount: item.totalGstAmount || 0,
        totalAmount: item.totalPrice || item.totalAmount || 0,
      })),
      subTotal: bill.subTotal || 0,
      totalDiscount: bill.totalDiscount || 0,
      discount: bill.discount || 0,
      discountType: (bill.discountType as "flat" | "percentage") || "flat",
      totalCGST: bill.totalCGST || 0,
      totalSGST: bill.totalSGST || 0,
      totalIGST: bill.totalIGST || 0,
      totalGST: bill.totalGST || 0,
      otherCharges: bill.otherCharges || 0,
      roundOff: bill.roundOff || 0,
      grandTotal: bill.grandTotal || 0,
      paymentStatus: bill.paymentStatus || "unpaid",
      paymentMethod: bill.paymentMethod,
      referenceNumber: bill.referenceNumber,
      paymentDate: safeDate(bill.paymentDate) || undefined,
    };
  },

  // Get next GRN number
  getNextGRNNumber: async (): Promise<string> => {
    const response = await axiosInstance.get<
      ApiResponse<{ grnNumber: string }>
    >("/api/purchase/bills/next-grn-number");
    return response.data.data.grnNumber;
  },

  // Create bill/GRN
  create: async (
    data: BillFormData
  ): Promise<{ data: Bill; message: string }> => {
    const formData = new FormData();

    // Append basic fields
    formData.append("grnNumber", data.grnNumber);
    formData.append("invoiceNumber", data.invoiceNumber);
    formData.append("grnDate", data.grnDate);
    formData.append("supplierId", data.supplierId);
    formData.append("supplierName", data.supplierName);
    if (data.poId) formData.append("poId", data.poId);
  
    formData.append("billDueDate", data.billDueDate);

    // Addresses
    formData.append("billingAddress", data.billingAddress);
    formData.append("shippingAddress", data.shippingAddress);
    formData.append("warehouseId", data.warehouseId);
    formData.append("warehouseName", data.warehouseName);

    // Shipment Details
    formData.append("shipmentReceivedDate", data.shipmentReceivedDate);
    if (data.deliveryChallanNumber)
      formData.append("deliveryChallanNumber", data.deliveryChallanNumber);
    if (data.transporterName)
      formData.append("transporterName", data.transporterName);
    if (data.eWayBillNumber)
      formData.append("eWayBillNumber", data.eWayBillNumber);
    if (data.remarks) formData.append("remarks", data.remarks);

    // Invoice copy file
    if (data.invoiceCopy && data.invoiceCopy instanceof File) {
      formData.append("invoiceCopy", data.invoiceCopy);
    }

    // Supplier Details
    formData.append("contactPersonName", data.contactPersonName);
    formData.append("supplierPhone", data.supplierPhone);
    formData.append("supplierEmail", data.supplierEmail);
    formData.append("supplierGSTIN", data.supplierGSTIN);
    formData.append("supplierAddress", data.supplierAddress);

    // Items as JSON
    formData.append("items", JSON.stringify(data.items));

    // Summary
    formData.append("subTotal", data.subTotal.toString());
    formData.append("totalDiscount", data.totalDiscount.toString());
    formData.append("discount", data.discount.toString());
    formData.append("discountType", data.discountType);
    formData.append("totalCGST", data.totalCGST.toString());
    formData.append("totalSGST", data.totalSGST.toString());
    formData.append("totalIGST", data.totalIGST.toString());
    formData.append("totalGST", data.totalGST.toString());
    formData.append("otherCharges", data.otherCharges.toString());
    formData.append("roundOff", data.roundOff.toString());
    formData.append("grandTotal", data.grandTotal.toString());

    // Payment
    formData.append("paymentStatus", data.paymentStatus);
    if (data.paymentMethod)
      formData.append("paymentMethod", data.paymentMethod);
    if (data.referenceNumber)
      formData.append("referenceNumber", data.referenceNumber);
    if (data.paymentDate) formData.append("paymentDate", data.paymentDate);

    const response = await axiosInstance.post<ApiResponse<Bill>>(
      "/api/purchase/bills",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return {
      data: response.data.data,
      message:
        response.data.message || "Bill created and stock updated successfully",
    };
  },

  // Update bill/GRN
  update: async (
    id: string,
    data: BillFormData
  ): Promise<{ data: Bill; message: string }> => {
    const formData = new FormData();

    // Append basic fields
    formData.append("grnNumber", data.grnNumber);
    formData.append("invoiceNumber", data.invoiceNumber);
    formData.append("grnDate", data.grnDate);
    formData.append("supplierId", data.supplierId);
    formData.append("supplierName", data.supplierName);
    if (data.poId) formData.append("poId", data.poId);
   
    formData.append("billDueDate", data.billDueDate);

    // Addresses
    formData.append("billingAddress", data.billingAddress);
    formData.append("shippingAddress", data.shippingAddress);
    formData.append("warehouseId", data.warehouseId);
    formData.append("warehouseName", data.warehouseName);

    // Shipment Details
    formData.append("shipmentReceivedDate", data.shipmentReceivedDate);
    if (data.deliveryChallanNumber)
      formData.append("deliveryChallanNumber", data.deliveryChallanNumber);
    if (data.transporterName)
      formData.append("transporterName", data.transporterName);
    if (data.eWayBillNumber)
      formData.append("eWayBillNumber", data.eWayBillNumber);
    if (data.remarks) formData.append("remarks", data.remarks);

    // Invoice copy file (only if new file)
    if (data.invoiceCopy && data.invoiceCopy instanceof File) {
      formData.append("invoiceCopy", data.invoiceCopy);
    } else if (typeof data.invoiceCopy === "string") {
      formData.append("existingInvoiceCopy", data.invoiceCopy);
    }

    // Supplier Details
    formData.append("contactPersonName", data.contactPersonName);
    formData.append("supplierPhone", data.supplierPhone);
    formData.append("supplierEmail", data.supplierEmail);
    formData.append("supplierGSTIN", data.supplierGSTIN);
    formData.append("supplierAddress", data.supplierAddress);

    // Items as JSON
    formData.append("items", JSON.stringify(data.items));

    // Summary
    formData.append("subTotal", data.subTotal.toString());
    formData.append("totalDiscount", data.totalDiscount.toString());
    formData.append("discount", data.discount.toString());
    formData.append("discountType", data.discountType);
    formData.append("totalCGST", data.totalCGST.toString());
    formData.append("totalSGST", data.totalSGST.toString());
    formData.append("totalIGST", data.totalIGST.toString());
    formData.append("totalGST", data.totalGST.toString());
    formData.append("otherCharges", data.otherCharges.toString());
    formData.append("roundOff", data.roundOff.toString());
    formData.append("grandTotal", data.grandTotal.toString());

    // Payment
    formData.append("paymentStatus", data.paymentStatus);
    if (data.paymentMethod)
      formData.append("paymentMethod", data.paymentMethod);
    if (data.referenceNumber)
      formData.append("referenceNumber", data.referenceNumber);
    if (data.paymentDate) formData.append("paymentDate", data.paymentDate);

    const response = await axiosInstance.put<ApiResponse<Bill>>(
      `/api/purchase/bills/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return {
      data: response.data.data,
      message: response.data.message || "Bill updated successfully",
    };
  },

  // Delete bill - DISABLED
  // Bills should not be deleted once created (audit trail)
  // delete: async (id: string): Promise<void> => {
  //   await axiosInstance.delete(`/api/purchase/bills/${id}`);
  // },

  // Update payment status
  updatePaymentStatus: async (
    id: string,
    paymentStatus: "paid" | "unpaid",
    paymentMethod?: string,
    referenceNumber?: string
  ): Promise<{ data: Bill; message: string }> => {
    const response = await axiosInstance.patch<ApiResponse<Bill>>(
      `/api/purchase/bills/${id}/payment-status`,
      {
        paymentStatus,
        paymentMethod,
        referenceNumber,
      }
    );
    return {
      data: response.data.data,
      message: response.data.message || "Payment status updated",
    };
  },

  // Get bill statistics
  getStats: async () => {
    const response = await axiosInstance.get("/api/purchase/bills/stats");
    return response.data.data;
  },

  // Get bills by supplier
  getBySupplier: async (supplierId: string): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      `/api/purchase/bills/supplier/${supplierId}`
    );
    return response.data.data;
  },

  // Get bills by warehouse
  getByWarehouse: async (warehouseId: string): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      `/api/purchase/bills/warehouse/${warehouseId}`
    );
    return response.data.data;
  },

  // Get bills by purchase order
  getByPurchaseOrder: async (poId: string): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      `/api/purchase/bills/purchase-order/${poId}`
    );
    return response.data.data;
  },

  // Get unpaid bills
  getUnpaid: async (): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      "/api/purchase/bills/unpaid"
    );
    return response.data.data;
  },

  // Get overdue bills
  getOverdue: async (): Promise<Bill[]> => {
    const response = await axiosInstance.get<ApiResponse<Bill[]>>(
      "/api/purchase/bills/overdue"
    );
    return response.data.data;
  },
};
