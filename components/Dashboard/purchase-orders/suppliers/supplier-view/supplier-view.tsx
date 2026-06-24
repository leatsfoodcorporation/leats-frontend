"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Receipt,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import SupplierViewDetail from "./supplier-view-details";
import SupplierViewListItems from "./supplier-view-list-items";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  supplierType: string;
  contactPersonName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingAddressSameAsBilling: boolean;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  taxId: string;
  remarks: string;
  attachments: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SupplierViewProps {
  supplierId: string;
}

export default function SupplierView({ supplierId }: SupplierViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { canView } = usePermissions();
  const [activeTab, setActiveTab] = useState("purchase-orders");
  const [counts, setCounts] = useState({
    purchaseOrders: 0,
    bills: 0,
    expenses: 0,
  });

  // Get tab from URL path on initial load only
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    const pathSegments = normalizedPath.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if we're on a valid tab route
    const validTabs = ["purchase-orders", "bills", "expenses"];
    if (validTabs.includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else if (
      normalizedPath ===
      `/dashboard/purchase-orders/suppliers-list/${supplierId}`
    ) {
      // Default to purchase-orders tab and update URL without refresh
      setActiveTab("purchase-orders");
      window.history.replaceState(
        null,
        "",
        `/dashboard/purchase-orders/suppliers-list/${supplierId}/purchase-orders`
      );
    }
  }, [pathname, supplierId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pathSegments = path.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      const validTabs = ["purchase-orders", "bills", "expenses"];
      if (validTabs.includes(lastSegment)) {
        setActiveTab(lastSegment);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    fetchSupplier();
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        `/api/purchase/suppliers/${supplierId}`
      );
      if (response.data.success) {
        setSupplier(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err.response?.data?.error || "Failed to fetch supplier details"
      );
      router.push("/dashboard/purchase-orders/suppliers-list");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [poResponse, billResponse, expenseResponse] = await Promise.all([
        axiosInstance.get(
          `/api/purchase/purchase-orders?supplierId=${supplierId}`
        ),
        axiosInstance.get(`/api/purchase/bills?supplierId=${supplierId}`),
        axiosInstance.get(`/api/purchase/expenses?supplierId=${supplierId}`),
      ]);

      setCounts({
        purchaseOrders: poResponse.data.success
          ? poResponse.data.data.length
          : 0,
        bills: billResponse.data.success ? billResponse.data.data.length : 0,
        expenses: expenseResponse.data.success
          ? expenseResponse.data.data.length
          : 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-muted-foreground">Loading supplier...</span>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push("/dashboard/purchase-orders/suppliers-list")
          }
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Supplier Details</h1>
          <p className="text-sm text-muted-foreground">
            View supplier information and related transactions
          </p>
        </div>
      </div>

      {/* Supplier Details */}
      <SupplierViewDetail supplier={supplier} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
            Purchase Orders
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {counts.purchaseOrders}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Total orders placed
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">
            Bills/GRN
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {counts.bills}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Goods received
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">
            Expenses
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {counts.expenses}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Total expenses
          </div>
        </div>
      </div>

      {/* Tabs with Purchase Orders, Bills, and Expenses */}
      <div className="w-full">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // Update URL without page refresh using History API
            window.history.pushState(
              null,
              "",
              `/dashboard/purchase-orders/suppliers-list/${supplierId}/${value}`
            );
          }}
          className="w-full"
        >
          <TabsList className="w-full max-w-2xl grid grid-cols-3 bg-muted p-1 rounded-lg">
            {canView("purchase_orders") && <TabsTrigger value="purchase-orders" className="gap-2">
              <ShoppingCart className="size-4" />
              Purchase Orders
              <Badge variant="secondary" className="ml-1">
                {counts.purchaseOrders}
              </Badge>
            </TabsTrigger>}
            {canView("bills") && <TabsTrigger value="bills" className="gap-2">
              <Receipt className="size-4" />
              Bills/GRN
              <Badge variant="secondary" className="ml-1">
                {counts.bills}
              </Badge>
            </TabsTrigger>}
            {canView("expenses") && <TabsTrigger value="expenses" className="gap-2">
              <Wallet className="size-4" />
              Expenses
              <Badge variant="secondary" className="ml-1">
                {counts.expenses}
              </Badge>
            </TabsTrigger>}
          </TabsList>

          <TabsContent value="purchase-orders" className="mt-6 w-full">
            <SupplierViewListItems
              supplierId={supplierId}
              activeTab="purchase-orders"
            />
          </TabsContent>

          <TabsContent value="bills" className="mt-6 w-full">
            <SupplierViewListItems supplierId={supplierId} activeTab="bills" />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6 w-full">
            <SupplierViewListItems
              supplierId={supplierId}
              activeTab="expenses"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
