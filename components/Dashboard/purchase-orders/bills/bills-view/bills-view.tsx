"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import BillsSidebar from "./bills-sidebar";
import BillDetails from "./bill-details";
import { billService, type Bill } from "@/services/billService";
import { toast } from "sonner";

interface BillsViewProps {
  billId: string;
}

export default function BillsView({ billId }: BillsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedBillId, setSelectedBillId] = useState<string>(billId);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  // Get Bill ID from URL path on initial load
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    const pathSegments = normalizedPath.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if the last segment is a valid Bill ID (not "view")
    if (lastSegment && lastSegment !== "view") {
      setSelectedBillId(lastSegment);
    }
  }, [pathname]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pathSegments = path.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment && lastSegment !== "view") {
        setSelectedBillId(lastSegment);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch bill when selectedBillId changes
  useEffect(() => {
    if (selectedBillId) {
      fetchBill(selectedBillId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBillId]);

  const fetchBill = async (id: string) => {
    try {
      setLoading(true);
      const data = await billService.getById(id);
      // Transform BillFormData back to Bill for display
      const billData: Bill = {
        id: id,
        billId: data.grnNumber,
        grnNumber: data.grnNumber,
        supplierInvoiceNo: data.invoiceNumber,
        grnDate: data.grnDate,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        poId: data.poId,
        poNumber: data.poId, // Will be populated from backend
        billDueDate: data.billDueDate,
        billingAddress: data.billingAddress,
        shippingAddress: data.shippingAddress,
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
        receivedDate: data.shipmentReceivedDate,
        vehicleNumber: data.deliveryChallanNumber,
        transporterName: data.transporterName,
        eWayBillNumber: data.eWayBillNumber,
        remarks: data.remarks,
        invoiceCopyUrl:
          typeof data.invoiceCopy === "string" ? data.invoiceCopy : undefined,
        contactPersonName: data.contactPersonName,
        supplierPhone: data.supplierPhone,
        supplierEmail: data.supplierEmail,
        supplierGSTIN: data.supplierGSTIN,
        supplierAddress: data.supplierAddress,
        items: data.items.map((item) => ({
          id: item.id,
          category: item.category,
          itemId: item.itemId,
          productName: item.itemName,
          sku: item.itemCode,
          hsnCode: item.hsnCode,
          receivedQuantity: item.quantityReceived,
          uom: item.uom,
          batchNumber: item.batchNo,
          expiryDate: item.expiryDate,
          manufacturingDate: item.mfgDate,
          price: item.purchasePrice,
          gstPercentage: item.gstPercentage,
          gstType: item.gstType,
          cgstPercentage: item.cgstPercentage,
          sgstPercentage: item.sgstPercentage,
          igstPercentage: item.igstPercentage,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          totalGstAmount: item.totalGstAmount,
          totalPrice: item.totalAmount,
        })),
        subTotal: data.subTotal,
        totalDiscount: data.totalDiscount,
        totalCGST: data.totalCGST,
        totalSGST: data.totalSGST,
        totalIGST: data.totalIGST,
        totalGST: data.totalGST,
        otherCharges: data.otherCharges,
        roundOff: data.roundOff,
        grandTotal: data.grandTotal,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        paymentDate: data.paymentDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBill(billData);
    } catch (error) {
      console.error("Error fetching bill:", error);
      toast.error("Failed to load bill details");
      router.push("/dashboard/purchase-orders/bills-list");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBill = (id: string) => {
    setSelectedBillId(id);
    // Update URL without page refresh using History API
    window.history.pushState(
      null,
      "",
      `/dashboard/purchase-orders/bills-list/view/${id}`
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Does NOT refresh when clicking bills */}
        <BillsSidebar
          selectedBillId={selectedBillId}
          onSelectBill={handleSelectBill}
        />

        {/* Details - Only this section updates */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-muted-foreground">Loading bill...</span>
            </div>
          </div>
        ) : bill ? (
          <BillDetails bill={bill} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Bill not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
