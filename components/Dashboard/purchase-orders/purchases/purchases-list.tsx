"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Eye, Search, Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  purchaseOrderService,
  type PurchaseOrder,
} from "@/services/purchaseService";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  completed: "default",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  completed: "Completed",
};

const getStatusColor = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  return statusColors[status] || "secondary";
};

const getStatusLabel = (status: string): string => {
  return statusLabels[status] || status;
};


export default function PurchasesList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const currencySymbol = useCurrency();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getAll();
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(
    (po) =>
      po.poId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchaseOrders = filteredPurchaseOrders.slice(startIndex, endIndex);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis-end");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/purchase-orders/purchases-list/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/purchase-orders/purchases-list/view/${id}`);
  };

  const handleCreate = () => {
    router.push(`/dashboard/purchase-orders/purchases-list/new`);
  };

  const handleStatusChange = async (
    poId: string,
    currentStatus: string,
    newStatus: string
  ) => {
    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["draft", "completed"],
      completed: ["completed"],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      toast.error(
        `Cannot change status from "${currentStatus}" to "${newStatus}"`
      );
      return;
    }
    
    // Prevent changing from completed
    if (currentStatus === "completed" && newStatus !== "completed") {
      toast.error("Completed purchase orders cannot be modified");
      return;
    }

    try {
      // Get the full PO data
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) {
        toast.error("Purchase order not found");
        return;
      }

      // Get admin currency from authService
      const adminData = await authService.getCurrentAdmin();
      const currency = adminData.currency || "INR";

      // Prepare update data
      const updateData = {
        supplierInfo: {
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          contactPersonName: po.contactPersonName || "",
          supplierPhone: po.supplierPhone,
          supplierEmail: po.supplierEmail,
          supplierGSTIN: po.supplierGSTIN || "",
        },
        billingAddress: po.billingAddress,
        shippingAddress: po.shippingAddress,
        warehouseId: po.warehouseId,
        warehouseName: po.warehouseName,
        poId: po.poId,
        poDate: po.poDate.split("T")[0],
        expectedDeliveryDate: po.expectedDeliveryDate.split("T")[0],
       
        poStatus: newStatus,
        poNotes: po.poNotes || "",
        currency: currency,
        currencySymbol: currencySymbol,
        items: po.items,
        subTotal: po.subTotal,
        totalQuantity: po.totalQuantity,
        discount: po.discount,
        discountType: po.discountType as "percentage" | "flat",
        gstBreakdown: [],
        totalCGST: po.totalCGST,
        totalSGST: po.totalSGST,
        totalIGST: po.totalIGST,
        totalGST: po.totalGST,
        otherCharges: po.otherCharges,
        roundingAdjustment: po.roundingAdjustment,
        grandTotal: po.grandTotal,
      };

      const result = await purchaseOrderService.update(poId, updateData);

      // Update local state
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, poStatus: newStatus } : p))
      );

      toast.success(result.message || "Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update status";
      toast.error(errorMessage);
    }
  };

  const getAvailableStatuses = (currentStatus: string): string[] => {
    const validTransitions: Record<string, string[]> = {
      draft: ["draft", "completed"],
      completed: ["completed"],
    };
    return validTransitions[currentStatus] || [currentStatus];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Purchase Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>PO Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Grand Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <p className="text-muted-foreground">
                      Loading purchase orders...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentPurchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No purchase orders found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPurchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poId}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>
                    {new Date(po.poDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                  </TableCell>
              
                  <TableCell>{po.items?.length || 0} items</TableCell>
                  <TableCell className="font-medium">
                    {currencySymbol}
                    {(po.grandTotal || 0).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {po.poStatus === "completed" ? (
                      <Badge variant={getStatusColor(po.poStatus)}>
                        {getStatusLabel(po.poStatus)}
                      </Badge>
                    ) : (
                      <Select
                        value={po.poStatus}
                        onValueChange={(value) =>
                          handleStatusChange(po.id, po.poStatus, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue>
                            <Badge variant={getStatusColor(po.poStatus)}>
                              {getStatusLabel(po.poStatus)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableStatuses(po.poStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`size-2 rounded-full ${
                                    status === "draft"
                                      ? "bg-gray-500"
                                      : "bg-green-500"
                                  }`}
                                />
                                {getStatusLabel(status)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleView(po.id)}
                        title="View purchase order"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(po.id)}
                        title="Edit purchase order"
                        disabled={po.poStatus === "completed"}
                      >
                        <Edit className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPurchaseOrders.length)} of{" "}
            {filteredPurchaseOrders.length} purchase orders
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis-start" || page === "ellipsis-end" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
