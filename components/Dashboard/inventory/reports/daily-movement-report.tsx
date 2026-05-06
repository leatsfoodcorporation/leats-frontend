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
import { Loader2, Download, TrendingUp, TrendingDown, CalendarIcon } from "lucide-react";
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

interface Warehouse {
  id: string;
  name: string;
}

interface DailyMovementItem {
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  openingStock: number;
  increases: number;
  decreases: number;
  closingStock: number;
}

interface DailyMovementReport {
  date: string;
  summary: {
    totalItems: number;
    totalIncreases: number;
    totalDecreases: number;
    byMethod: {
      manual: {
        increases: number;
        decreases: number;
      };
      purchase: {
        increases: number;
      };
      online: {
        decreases: number;
      };
      pos: {
        decreases: number;
      };
    };
  };
  report: DailyMovementItem[];
}

export default function DailyMovementReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const [date, setDate] = useState<Date>(dateParam ? new Date(dateParam) : new Date());
  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<DailyMovementReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        `/api/inventory/reports/daily-movement?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
        setCurrentPage(1); // Reset to first page on new report
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch daily movement report");
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
        "Item Name": item.itemName,
        "Warehouse": item.warehouseName,
        "Opening Stock": item.openingStock,
        "Increases": item.increases,
        "Decreases": item.decreases,
        "Closing Stock": item.closingStock,
        "Net Change": item.increases - item.decreases,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Movement");
    XLSX.writeFile(workbook, `daily-movement-${format(date, "yyyy-MM-dd")}.xlsx`);
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.totalItems}</div>
                <p className="text-xs text-muted-foreground">Items with Movement</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  +{report.summary.totalIncreases}
                </div>
                <p className="text-xs text-muted-foreground">Total Increases</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  -{report.summary.totalDecreases}
                </div>
                <p className="text-xs text-muted-foreground">Total Decreases</p>
              </CardContent>
            </Card>
          </div>

          {/* Movement by Method */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Movement by Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Manual Adjustment</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-green-600">+{report.summary.byMethod.manual.increases}</span>
                      {" / "}
                      <span className="text-red-600">-{report.summary.byMethod.manual.decreases}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Purchase Orders</p>
                    <p className="text-sm text-green-600">
                      +{report.summary.byMethod.purchase.increases}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Online Sales</p>
                    <p className="text-sm text-red-600">
                      -{report.summary.byMethod.online.decreases}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">POS Sales</p>
                    <p className="text-sm text-red-600">
                      -{report.summary.byMethod.pos.decreases}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Report Table */}
      {report && (
        <>
          <div className="border rounded-lg">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Increases</TableHead>
                <TableHead className="text-right">Decreases</TableHead>
                <TableHead className="text-right">Closing</TableHead>
                <TableHead className="text-right">Net Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No movements recorded for this date
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((item) => {
                  const netChange = item.increases - item.decreases;
                  return (
                    <TableRow key={item.itemId}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell className="text-right">{item.openingStock}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.increases > 0 && `+${item.increases}`}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.decreases > 0 && `-${item.decreases}`}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.closingStock}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {netChange > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">+{netChange}</span>
                            </>
                          ) : netChange < 0 ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">{netChange}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
    </div>
  );
}
