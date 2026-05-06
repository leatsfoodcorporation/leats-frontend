"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { purchaseOrderService, type PurchaseOrder } from "@/services/purchaseService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

const ITEMS_PER_PAGE = 20;

interface PurchaseSidebarProps {
  selectedPOId: string;
  onSelectPO: (poId: string) => void; 
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  sent: "default",
  partially_received: "outline",
  completed: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_received: "Partially Received",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function PurchaseSidebar({
  selectedPOId,
  onSelectPO,
}: PurchaseSidebarProps) {
  const router = useRouter();
  const [allPurchaseOrders, setAllPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [displayedPOs, setDisplayedPOs] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const currencySymbol = useCurrency();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    // Filter purchase orders based on search query
    if (searchQuery.trim() === "") {
      setFilteredPOs(allPurchaseOrders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allPurchaseOrders.filter(
        (po) =>
          po.poId.toLowerCase().includes(query) ||
          po.supplierName.toLowerCase().includes(query)
      );
      setFilteredPOs(filtered);
    }
    // Reset pagination when search changes
    setPage(1);
  }, [searchQuery, allPurchaseOrders]);

  useEffect(() => {
    // Update displayed items when filtered list or page changes
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    setDisplayedPOs(filteredPOs.slice(startIndex, endIndex));
    setHasMore(endIndex < filteredPOs.length);
  }, [filteredPOs, page]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getAll();
      setAllPurchaseOrders(data);
      setFilteredPOs(data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    // Simulate a small delay for smooth UX
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  const handlePOClick = (poId: string) => {
    // Just call the callback - parent will handle URL update
    onSelectPO(poId);
  };

  const handleBack = () => {
    router.push("/dashboard/purchase-orders/purchases-list");
  };

  return (
    <div className="w-80 border-r    flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="font-semibold text-lg">Purchase Orders</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search PO or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Purchase Orders List */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No purchase orders found" : "No purchase orders"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {displayedPOs.map((po) => (
              <button
                key={po.id}
                onClick={() => handlePOClick(po.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-accent ${
                  selectedPOId === po.id
                    ? "bg-accent border-primary shadow-sm"
                    : "bg-background border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium text-sm truncate">{po.poId}</div>
                  <Badge
                    variant={statusColors[po.poStatus] || "secondary"}
                    className="text-xs shrink-0"
                  >
                    {statusLabels[po.poStatus] || po.poStatus}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="truncate">{po.supplierName}</div>
                  <div className="flex items-center justify-between">
                    <span>
                      {format(new Date(po.poDate), "MMM dd, yyyy")}
                    </span>
                    <span className="font-medium text-foreground">
                      {currencySymbol}{(po.grandTotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Intersection Observer Target */}
            {hasMore && (
              <div ref={observerTarget} className="py-4 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer Stats */}
      {!loading && allPurchaseOrders.length > 0 && (
        <div className="p-4 border-t bg-background">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Total POs:</span>
              <span className="font-medium text-foreground">
                {allPurchaseOrders.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Showing:</span>
              <span className="font-medium text-foreground">
                {displayedPOs.length} of {filteredPOs.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
