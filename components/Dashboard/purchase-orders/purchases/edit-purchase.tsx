"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import PurchaseForm from "./purchase-form";
import { toast } from "sonner";
import {
  purchaseOrderService,
  type PurchaseOrderFormData,
  type GSTBreakdown,
} from "@/services/purchaseService";
import { authService } from "@/services/authService";

// Local interface matching the form's expected structure
interface PurchaseOrderItem {
  id: string;
  itemId?: string;
  category: string;
  productName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  uom: string;
  price: number;
  gstRateId?: string; // GST Rate ID from finance service
  gstPercentage: number;
  gstType: "cgst_sgst" | "igst";
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  mrp: string;
  itemTotal: number;
  totalPrice: number;
}

interface PurchaseOrderData {
  supplierInfo: {
    supplierId: string;
    supplierName: string;
    contactPersonName: string;
    supplierPhone: string;
    supplierEmail: string;
    supplierGSTIN: string;
  };
  billingAddress: string;
  shippingAddress: string;
  warehouseId: string;
  warehouseName: string;
  poId: string;
  poDate: string;
  expectedDeliveryDate: string;

  poStatus: string;
  poNotes: string;
  currency: string;
  currencySymbol: string;
  items: PurchaseOrderItem[];
  subTotal: number;
  totalQuantity: number;
  discount: number;
  discountType: "percentage" | "flat";
  gstBreakdown: GSTBreakdown[];
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  otherCharges: number;
  roundingAdjustment: number;
  grandTotal: number;
}

export default function EditPurchase() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderData | null>(
    null
  );
  const [initialRowCategories, setInitialRowCategories] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchPurchaseOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getById(id);

      // Transform data to match form structure
      // Calculate GST breakdown from items
      const gstMap = new Map<
        string,
        {
          rate: number;
          gstType: "cgst_sgst" | "igst";
          cgstRate: number;
          sgstRate: number;
          igstRate: number;
          cgstAmount: number;
          sgstAmount: number;
          igstAmount: number;
          totalAmount: number;
        }
      >();

      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          const key = `${item.gstPercentage}-${item.gstType}`;
          if (!gstMap.has(key)) {
            gstMap.set(key, {
              rate: item.gstPercentage,
              gstType: item.gstType,
              cgstRate: item.cgstPercentage,
              sgstRate: item.sgstPercentage,
              igstRate: item.igstPercentage,
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: 0,
              totalAmount: 0,
            });
          }
          const breakdown = gstMap.get(key);
          if (breakdown) {
            breakdown.cgstAmount += item.cgstAmount || 0;
            breakdown.sgstAmount += item.sgstAmount || 0;
            breakdown.igstAmount += item.igstAmount || 0;
            breakdown.totalAmount += item.totalGstAmount || 0;
          }
        });
      }

      const gstBreakdown = Array.from(gstMap.values()).sort(
        (a, b) => a.rate - b.rate
      );

      // Transform items to include temporary IDs for form
      const transformedItems: PurchaseOrderItem[] = data.items.map(
        (item, index) => ({
          id: item.id || `temp-${index}`, // Ensure each item has an ID for form
          itemId: item.itemId,
          category: item.category,
          productName: item.productName,
          sku: item.sku,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          uom: item.uom,
          price: item.price,
          gstRateId: item.gstRateId, // Include GST Rate ID
          gstPercentage: item.gstPercentage,
          gstType: item.gstType,
          cgstPercentage: item.cgstPercentage,
          sgstPercentage: item.sgstPercentage,
          igstPercentage: item.igstPercentage,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          totalGstAmount: item.totalGstAmount,
          mrp: item.mrp,
          itemTotal: item.itemTotal,
          totalPrice: item.totalPrice,
        })
      );

      // Build rowCategories map for existing items
      const initialRowCategories: Record<string, string> = {};
      transformedItems.forEach((item) => {
        if (item.category) {
          initialRowCategories[item.id] = item.category;
        }
      });

      // Get admin currency for display
      const adminData = await authService.getCurrentAdmin();
      const currency = adminData.currency || "INR";
      const currencySymbol =
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        })
          .formatToParts(0)
          .find((part) => part.type === "currency")?.value || "₹";

      const formData: PurchaseOrderData = {
        supplierInfo: {
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          contactPersonName: data.contactPersonName || "",
          supplierPhone: data.supplierPhone,
          supplierEmail: data.supplierEmail,
          supplierGSTIN: data.supplierGSTIN || "",
        },
        billingAddress: data.billingAddress,
        shippingAddress: data.shippingAddress,
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
        poId: data.poId,
        poDate: data.poDate.split("T")[0],
        expectedDeliveryDate: data.expectedDeliveryDate.split("T")[0],
       
       
        poStatus: data.poStatus,
        poNotes: data.poNotes || "",
        currency: currency,
        currencySymbol: currencySymbol,
        items: transformedItems,
        subTotal: data.subTotal || 0,
        totalQuantity: data.totalQuantity || 0,
        discount: data.discount || 0,
        discountType: (data.discountType as "percentage" | "flat") || "flat",
        gstBreakdown: gstBreakdown,
        totalCGST: data.totalCGST || 0,
        totalSGST: data.totalSGST || 0,
        totalIGST: data.totalIGST || 0,
        totalGST: data.totalGST || 0,
        otherCharges: data.otherCharges || 0,
        roundingAdjustment: data.roundingAdjustment || 0,
        grandTotal: data.grandTotal || 0,
      };

      setPurchaseOrder(formData);
      setInitialRowCategories(initialRowCategories);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      toast.error("Failed to load purchase order");
      router.push("/dashboard/purchase-orders/purchases-list");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    try {
      setIsSubmitting(true);

      if (isNew) {
        const result = await purchaseOrderService.create(data);
        // Use the message from backend response
        toast.success(result.message || "Purchase order created successfully");
      } else {
        const result = await purchaseOrderService.update(id, data);
        // Use the message from backend response
        toast.success(result.message || "Purchase order updated successfully");
      }

      router.push("/dashboard/purchase-orders/purchases-list");
    } catch (error) {
      console.error("Error saving purchase order:", error);
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save purchase order";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          Loading purchase order...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push("/dashboard/purchase-orders/purchases-list")
          }
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "Create Purchase Order" : "Edit Purchase Order"}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Create a new purchase order with complete details"
              : `Editing ${purchaseOrder?.poId}`}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <PurchaseForm
          initialData={purchaseOrder}
          initialRowCategories={initialRowCategories}
          onSubmit={handleSubmit}
          onCancel={() =>
            router.push("/dashboard/purchase-orders/purchases-list")
          }
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
