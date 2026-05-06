"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import PurchaseSidebar from "./purhcase-sidebar";
import PurchaseDetails from "./purchase-details";
import {
  purchaseOrderService,
  type PurchaseOrder,
} from "@/services/purchaseService";
import { toast } from "sonner";

interface PurchaseViewProps { 
  purchaseOrderId: string;
}

export default function PurchaseView({ purchaseOrderId }: PurchaseViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedPOId, setSelectedPOId] = useState<string>(purchaseOrderId);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Get PO ID from URL path on initial load
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    const pathSegments = normalizedPath.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if the last segment is a valid PO ID (not "view")
    if (lastSegment && lastSegment !== "view") {
      setSelectedPOId(lastSegment);
    }
  }, [pathname]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pathSegments = path.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment && lastSegment !== "view") {
        setSelectedPOId(lastSegment);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch purchase order when selectedPOId changes
  useEffect(() => {
    if (selectedPOId) {
      fetchPurchaseOrder(selectedPOId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPOId]);

  const fetchPurchaseOrder = async (poId: string) => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getById(poId);
      setPurchaseOrder(data);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      toast.error("Failed to load purchase order details");
      router.push("/dashboard/purchase-orders/purchases-list");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPO = (poId: string) => {
    setSelectedPOId(poId);
    // Update URL without page refresh using History API (same as supplier view)
    window.history.pushState(
      null,
      "",
      `/dashboard/purchase-orders/purchases-list/view/${poId}`
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Does NOT refresh when clicking POs */}
        <PurchaseSidebar
          selectedPOId={selectedPOId}
          onSelectPO={handleSelectPO}
        />

        {/* Details - Only this section updates */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-muted-foreground">
                Loading purchase order...
              </span>
            </div>
          </div>
        ) : purchaseOrder ? (
          <PurchaseDetails purchaseOrder={purchaseOrder} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Purchase order not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
