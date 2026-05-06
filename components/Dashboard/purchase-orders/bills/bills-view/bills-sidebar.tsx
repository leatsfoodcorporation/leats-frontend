"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { billService, type Bill } from "@/services/billService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

const ITEMS_PER_PAGE = 20;

interface BillsSidebarProps {
  selectedBillId: string;
  onSelectBill: (billId: string) => void;
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  unpaid: "destructive",
  partial: "outline",
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  partial: "Partial",
};

export default function BillsSidebar({
  selectedBillId,
  onSelectBill,
}: BillsSidebarProps) {
  const router = useRouter();
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [displayedBills, setDisplayedBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const currencySymbol = useCurrency();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    // Filter bills based on search query
    if (searchQuery.trim() === "") {
      setFilteredBills(allBills);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allBills.filter(
        (bill) =>
          bill.grnNumber.toLowerCase().includes(query) ||
          (bill.supplierInvoiceNo || "").toLowerCase().includes(query) ||
          bill.supplierName.toLowerCase().includes(query)
      );
      setFilteredBills(filtered);
    }
    // Reset pagination when search changes
    setPage(1);
  }, [searchQuery, allBills]);

  useEffect(() => {
    // Update displayed items when filtered list or page changes
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    setDisplayedBills(filteredBills.slice(startIndex, endIndex));
    setHasMore(endIndex < filteredBills.length);
  }, [filteredBills, page]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await billService.getAll();
      setAllBills(data);
      setFilteredBills(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load bills");
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

  const handleBillClick = (billId: string) => {
    // Just call the callback - parent will handle URL update
    onSelectBill(billId);
  };

  const handleBack = () => {
    router.push("/dashboard/purchase-orders/bills-list");
  };

  return (
    <div className="w-80 border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="font-semibold text-lg">Bills / GRN</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search GRN or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Bills List */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No bills found" : "No bills"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {displayedBills.map((bill) => (
              <button
                key={bill.id}
                onClick={() => handleBillClick(bill.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-accent ${
                  selectedBillId === bill.id
                    ? "bg-accent border-primary shadow-sm"
                    : "bg-background border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium text-sm truncate">
                    {bill.grnNumber}
                  </div>
                  <Badge
                    variant={statusColors[bill.paymentStatus] || "secondary"}
                    className="text-xs shrink-0"
                  >
                    {statusLabels[bill.paymentStatus] || bill.paymentStatus}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {/* {bill.supplierInvoiceNo && (
                    <div className="truncate text-[10px]">
                      Invoice: {bill.supplierInvoiceNo}
                    </div>
                  )} */}
                  <div className="flex items-center justify-between">
                    <div className="truncate">{bill.supplierName}</div>
                    <span className="font-medium text-foreground">
                      {currencySymbol}
                      {(bill.grandTotal || 0).toLocaleString("en-IN")}
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
      {!loading && allBills.length > 0 && (
        <div className="p-4 border-t bg-background">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Total Bills:</span>
              <span className="font-medium text-foreground">
                {allBills.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Showing:</span>
              <span className="font-medium text-foreground">
                {displayedBills.length} of {filteredBills.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
