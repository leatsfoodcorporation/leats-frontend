"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import PurchaseOrderTable from "./view-tables/purchase-order-table";
import BillsTable from "./view-tables/bills-table";
import ExpensesView from "./view-tables/expenses-view";

interface PurchaseOrder {
  id: string;
  poId: string;
  poDate: string;
  expectedDeliveryDate: string;
  poStatus: string;
  grandTotal: number;
  totalQuantity: number;
  warehouseName: string;
  createdAt: string;
}

interface Bill {
  id: string;
  billId: string;
  grnNumber: string;
  billDate: string;
  paymentStatus: string;
  grandTotal: number;
  totalQuantity: number;
  warehouseName: string;
  createdAt: string;
}

interface Expense {
  id: string;
  expenseNumber: string;
  categoryName: string;
  expense: string;
  amount: number;
  expenseDate: string;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

interface SupplierViewListItemsProps {
  supplierId: string;
  activeTab: "purchase-orders" | "bills" | "expenses";
}

export default function SupplierViewListItems({
  supplierId,
  activeTab,
}: SupplierViewListItemsProps) {
  // Data state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data for this supplier
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [poResponse, billResponse, expenseResponse] = await Promise.all([
        axiosInstance.get(
          `/api/purchase/purchase-orders?supplierId=${supplierId}`
        ),
        axiosInstance.get(`/api/purchase/bills?supplierId=${supplierId}`),
        axiosInstance.get(`/api/purchase/expenses?supplierId=${supplierId}`),
      ]);

      if (poResponse.data.success) {
        setPurchaseOrders(poResponse.data.data);
      }
      if (billResponse.data.success) {
        setBills(billResponse.data.data);
      }
      if (expenseResponse.data.success) {
        setExpenses(expenseResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to fetch supplier data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-muted-foreground">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeTab === "purchase-orders" && (
        <PurchaseOrderTable items={purchaseOrders} />
      )}
      {activeTab === "bills" && <BillsTable items={bills} />}
      {activeTab === "expenses" && <ExpensesView items={expenses} />}
    </>
  );
}
