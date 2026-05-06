"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Loader2, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
import * as XLSX from "xlsx";

interface Warehouse {
  id: string;
  name: string;
}

interface Category {
  name: string;
}

interface StockAvailabilityItem {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  category: string;
  warehouse: string;
  currentStock: number;
  lowStockAlert: number;
  status: string;
  uom: string;
  availabilityPercentage: number;
}

interface StockAvailabilityReport {
  summary: {
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalUnits: number;
  };
  report: StockAvailabilityItem[];
}

export default function StockAvailabilityReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [lowStock, setLowStock] = useState(searchParams.get("lowStock") || "false");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [report, setReport] = useState<StockAvailabilityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchWarehouses();
    fetchCategories();
  }, []);

  // Update URL when filters change
  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    updateSearchParams("warehouse", value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateSearchParams("category", value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateSearchParams("status", value);
  };

  const handleLowStockChange = (value: string) => {
    setLowStock(value);
    updateSearchParams("lowStock", value);
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

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/api/inventory/categories");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (warehouseId !== "all") params.append("warehouseId", warehouseId);
      if (category !== "all") params.append("category", category);
      if (status !== "all") params.append("status", status);
      params.append("lowStock", lowStock);

      const response = await axiosInstance.get(
        `/api/inventory/reports/stock-availability?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch stock availability report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!report || !report.report.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      report.report.map((item) => ({
        "Item Name": item.itemName,
        "SKU": item.itemCode || "N/A",
        "Category": item.category,
        "Warehouse": item.warehouse,
        "Current Stock": item.currentStock,
        "Low Stock Alert": item.lowStockAlert,
        "UOM": item.uom,
        "Status": item.status,
        "Availability %": item.availabilityPercentage,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Availability");
    XLSX.writeFile(workbook, `stock-availability-${new Date().toISOString().split("T")[0]}.xlsx`);
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Filter</Label>
          <Select value={lowStock} onValueChange={handleLowStockChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">All Items</SelectItem>
              <SelectItem value="true">Low Stock Only</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.totalItems}</div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{report.summary.inStock}</div>
                <p className="text-xs text-muted-foreground">In Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{report.summary.lowStock}</div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{report.summary.outOfStock}</div>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.totalUnits}</div>
                <p className="text-xs text-muted-foreground">Total Units</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Alert Level</TableHead>
                  <TableHead className="text-right">Availability</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item) => (
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
                      <TableCell className="text-right font-semibold">
                        {item.currentStock} {item.uom}
                      </TableCell>
                      <TableCell className="text-right">{item.lowStockAlert}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                item.availabilityPercentage >= 80 ? "bg-green-600" :
                                item.availabilityPercentage >= 50 ? "bg-yellow-600" :
                                item.availabilityPercentage >= 25 ? "bg-orange-600" :
                                "bg-red-600"
                              )}
                              style={{ width: `${Math.min(item.availabilityPercentage, 100)}%` }}
                            />
                          </div>
                          <span className={cn(
                            "font-medium text-sm min-w-[45px] text-right",
                            item.availabilityPercentage >= 80 ? "text-green-600" :
                            item.availabilityPercentage >= 50 ? "text-yellow-600" :
                            item.availabilityPercentage >= 25 ? "text-orange-600" :
                            "text-red-600"
                          )}>
                            {item.availabilityPercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.status === "out_of_stock" ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Out of Stock
                          </Badge>
                        ) : item.status === "low_stock" ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock
                          </Badge>
                        )}
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
