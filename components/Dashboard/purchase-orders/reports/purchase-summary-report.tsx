"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CalendarIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { reportService, type PurchaseSummaryReport } from "@/services/reportService";
import axiosInstance from "@/lib/axios";
import { useCurrency } from "@/hooks/useCurrency";

interface Supplier {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function PurchaseSummaryReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrency();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [supplierId, setSupplierId] = useState(searchParams.get("supplier") || "all");
  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<PurchaseSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
    
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    
    setStartDate(startParam ? new Date(startParam) : start);
    setEndDate(endParam ? new Date(endParam) : end);
  }, []);

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSupplierChange = (value: string) => {
    setSupplierId(value);
    updateSearchParams("supplier", value);
  };

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    updateSearchParams("warehouse", value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateSearchParams("status", value);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      updateSearchParams("startDate", format(date, "yyyy-MM-dd"));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      updateSearchParams("endDate", format(date, "yyyy-MM-dd"));
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get("/api/purchase/suppliers");
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axiosInstance.get("/api/inventory/warehouses");
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsLoading(true);
      const filters = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        ...(supplierId !== "all" && { supplierId }),
        ...(warehouseId !== "all" && { warehouseId }),
        ...(status !== "all" && { status }),
      };

      const data = await reportService.getPurchaseSummary(filters);
      setReport(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch purchase summary report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!report || !report.purchaseOrders.length) return;

    try {
      const params = new URLSearchParams({
        startDate: format(startDate!, "yyyy-MM-dd"),
        endDate: format(endDate!, "yyyy-MM-dd"),
        ...(supplierId !== "all" && { supplierId }),
        ...(warehouseId !== "all" && { warehouseId }),
        ...(status !== "all" && { status }),
      });

      const response = await axiosInstance.get(
        `/api/purchase/reports/purchase-summary/export?${params}`,
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `purchase-summary-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  const totalPages = report ? Math.ceil(report.purchaseOrders.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = report ? report.purchaseOrders.slice(startIndex, endIndex) : [];

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
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      received: { variant: "default", label: "Received" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        <div className="space-y-2">
          <Label className="text-sm">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Supplier</Label>
          <Select value={supplierId} onValueChange={handleSupplierChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Warehouse</Label>
          <Select value={warehouseId} onValueChange={handleWarehouseChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Status</Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm opacity-0">Actions</Label>
          <Button onClick={fetchReport} disabled={isLoading} className="w-full h-10">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </div>

      {/* Export Button */}
      {report && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={exportToExcel} className="h-10">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      )}


      {/* Summary Cards */}
      {report && (
        <>
        
          {/* Purchase Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((po) => (
                    <TableRow key={po.poId}>
                      <TableCell className="font-medium">{po.poId}</TableCell>
                      <TableCell>{format(new Date(po.poDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell>{po.warehouseName}</TableCell>
                      <TableCell className="text-right">{po.totalQuantity}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(po.grandTotal)}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, report.purchaseOrders.length)} of{" "}
                {report.purchaseOrders.length} purchase orders
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
        </>
      )}
    </div>
  );
}
