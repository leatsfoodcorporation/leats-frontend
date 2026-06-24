"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, FileText } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { billService, type Bill } from "@/services/billService";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

export default function BillsList() {
  const router = useRouter();
  const { canAdd, canEdit, canDelete } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const currencySymbol = useCurrency();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load bills from API
  useEffect(() => {
    const loadBills = async () => {
      try {
        setLoading(true);
        const data = await billService.getAll();
        setBills(data);
      } catch (error) {
        console.error("Error loading bills:", error);
        toast.error("Failed to load bills");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, []);

  const filteredBills = bills.filter(
    (bill) =>
      (bill.grnNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (bill.supplierInvoiceNo || bill.invoiceNumber || bill.billId || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      bill.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBills = filteredBills.slice(startIndex, endIndex);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      paid: "default",
      unpaid: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by GRN, Invoice, or Supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {canAdd("bills") && <Button
          onClick={() =>
            router.push("/dashboard/purchase-orders/bills-list/new")
          }
        >
          <Plus className="size-4" />
          Create Bill / GRN
        </Button>}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading bills...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN Number</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>GRN Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentBills.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? "No bills found matching your search"
                      : "No bills found. Create your first bill!"}
                  </TableCell>
                </TableRow>
              ) : (
                currentBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      {bill.grnNumber || bill.billId}
                    </TableCell>
                    <TableCell>
                      {bill.supplierInvoiceNo || bill.invoiceNumber || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        bill.grnDate || bill.billDate || new Date()
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{bill.supplierName}</TableCell>
                    <TableCell>
                      {bill.poNumber || bill.poId ? (
                        <Badge variant="outline">
                          {bill.poNumber || bill.poId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{bill.items?.length || 0} items</TableCell>
                    <TableCell className="text-right font-medium">
                      {currencySymbol}
                      {(bill.grandTotal || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/purchase-orders/bills-list/view/${bill.id}`
                            )
                          }
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {canEdit("bills") && <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/purchase-orders/bills-list/${bill.id}`
                            )
                          }
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>}
                        {/* <Button variant="ghost" size="sm" title="Download PDF">
                          <FileText className="size-4" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredBills.length)} of{" "}
            {filteredBills.length} bills
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
