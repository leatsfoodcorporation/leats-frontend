"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
import { Loader2, Download, AlertCircle, TrendingUp, TrendingDown, CalendarIcon } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useCurrency } from '@/hooks/useCurrency';

interface Warehouse {
  id: string;
  name: string;
}

interface EODReportItem {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  category: string;
  warehouse: string;
  openingStock: number;
  currentStock: number;
  variance: number;
  itemValue: number;
  status: string;
}

interface EODReport {
  date: string;
  summary: {
    totalItems: number;
    totalUnits: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  report: EODReportItem[];
  isFutureDate?: boolean;
  noDataForDate?: boolean;
  message?: string;
}

export default function EODClosingStockReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const [date, setDate] = useState<Date>(dateParam ? new Date(dateParam) : new Date());
  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<EODReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currencySymbol = useCurrency();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    updateSearchParams("warehouse", value);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      updateSearchParams("date", format(newDate, "yyyy-MM-dd"));
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axiosInstance.get("/api/inventory/warehouses?status=active");
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ date: format(date, "yyyy-MM-dd") });
      if (warehouseId !== "all") {
        params.append("warehouseId", warehouseId);
      }

      const response = await axiosInstance.get(
        `/api/inventory/reports/eod-closing-stock?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
        setCurrentPage(1); // Reset to first page on new report
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch EOD closing stock report");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = report ? Math.ceil(report.report.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = report ? report.report.slice(startIndex, endIndex) : [];

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

  const exportToExcel = () => {
    if (!report || !report.report.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      report.report.map((item) => ({
        "Item": item.itemName,
        "SKU": item.itemCode || "N/A",
        "Category": item.category,
        "Warehouse": item.warehouse,
        "Opening": item.openingStock,
        "Current": item.currentStock,
        "Variance": item.variance,
        "Value": item.itemValue.toFixed(2),
        "Status": item.status,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EOD Closing Stock");
    XLSX.writeFile(workbook, `eod-closing-stock-${format(date, "yyyy-MM-dd")}.xlsx`);
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Warehouse</Label>
          <Select value={warehouseId} onValueChange={handleWarehouseChange}>
            <SelectTrigger>
              <SelectValue />
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
        <div className="flex items-end gap-2">
          <Button onClick={fetchReport} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
          {report && (
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{report.summary.totalItems}</div>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{report.summary.totalUnits}</div>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {currencySymbol}{report.summary.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{report.summary.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{report.summary.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      {report && (
        <>
          {report.report.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground">
                    {report.isFutureDate 
                      ? "Cannot generate report for future dates. Please select today or a past date."
                      : report.noDataForDate
                      ? "No EOD closing stock at this date. Stock adjustments may not have been recorded yet."
                      : "No inventory data found for the selected date and filters."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="border rounded-lg">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-xs text-muted-foreground">{item.itemCode || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell className="text-right">{item.openingStock}</TableCell>
                  <TableCell className="text-right font-semibold">{item.currentStock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.variance > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">+{item.variance}</span>
                        </>
                      ) : item.variance < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">{item.variance}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currencySymbol}{item.itemValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {item.status === "out_of_stock" ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock
                      </Badge>
                    ) : item.status === "low_stock" ? (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, report.report.length)} of{" "}
              {report.report.length} items
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
        </>
      )}
    </div>
  );
}
