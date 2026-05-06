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
import { Loader2, Download, CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
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
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Warehouse {
  id: string;
  name: string;
}

interface MovementItem {
  itemId: string;
  itemName: string;
  category: string;
  warehouse: string;
  totalIncreases: number;
  totalDecreases: number;
  netChange: number;
  movementCount: number;
}

interface MovementReport {
  summary: {
    totalMovements: number;
    totalIncreases: number;
    totalDecreases: number;
    uniqueItems: number;
    dateRange: {
      start: string;
      end: string;
    };
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
  report: MovementItem[];
}

export default function InventoryMovementReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<MovementReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchWarehouses();
    // Set default date range (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    // Check if dates are in URL params
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

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    updateSearchParams("warehouse", value);
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
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
      if (warehouseId !== "all") params.append("warehouseId", warehouseId);

      const response = await axiosInstance.get(
        `/api/inventory/reports/inventory-movement?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch inventory movement report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!report || !report.report.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      report.report.map((item) => ({
        "Item Name": item.itemName,
        "Category": item.category,
        "Warehouse": item.warehouse,
        "Total Increases": item.totalIncreases,
        "Total Decreases": item.totalDecreases,
        "Net Change": item.netChange,
        "Movement Count": item.movementCount,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Movement");
    XLSX.writeFile(workbook, `inventory-movement-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.xlsx`);
    toast.success("Report exported successfully");
  };

  const totalPages = report ? Math.ceil(report.report.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = report ? report.report.slice(startIndex, endIndex) : [];

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
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
              "Generate"
            )}
          </Button>
          {report && (
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.totalMovements}</div>
                <p className="text-xs text-muted-foreground">Total Movements</p>
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
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.uniqueItems}</div>
                <p className="text-xs text-muted-foreground">Unique Items</p>
              </CardContent>
            </Card>
          </div>

          {/* Movement by Method */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Movement Breakdown by Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <p className="text-sm font-medium text-blue-900 mb-2">Manual Adjustment</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-green-600">
                      +{report.summary.byMethod.manual.increases}
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      -{report.summary.byMethod.manual.decreases}
                    </p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm font-medium text-green-900 mb-2">Purchase Orders</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{report.summary.byMethod.purchase.increases}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-purple-50">
                  <p className="text-sm font-medium text-purple-900 mb-2">Online Sales</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{report.summary.byMethod.online.decreases}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-orange-50">
                  <p className="text-sm font-medium text-orange-900 mb-2">POS Sales</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{report.summary.byMethod.pos.decreases}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Increases</TableHead>
                  <TableHead className="text-right">Decreases</TableHead>
                  <TableHead className="text-right">Net Change</TableHead>
                  <TableHead className="text-right">Movements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No movements found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.totalIncreases > 0 && `+${item.totalIncreases}`}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.totalDecreases > 0 && `-${item.totalDecreases}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.netChange > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-semibold">+{item.netChange}</span>
                            </>
                          ) : item.netChange < 0 ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 font-semibold">{item.netChange}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{item.movementCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
