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
import { Loader2, Download, CalendarIcon, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Warehouse {
  id: string;
  name: string;
}

interface TopProduct {
  itemId: string;
  itemName: string;
  category: string;
  totalQuantitySold: number;
  totalOrders: number;
  warehouses: string[];
  averagePerOrder: string;
  currentStock: number;
  stockStatus: string;
}

interface TopSellingReport {
  summary: {
    totalSalesMovements: number;
    totalQuantitySold: number;
    uniqueProductsSold: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  topProducts: TopProduct[];
}

export default function TopSellingReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [warehouseId, setWarehouseId] = useState(searchParams.get("warehouse") || "all");
  const [limit, setLimit] = useState(searchParams.get("limit") || "20");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<TopSellingReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
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

  const handleLimitChange = (value: string) => {
    setLimit(value);
    updateSearchParams("limit", value);
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
        limit,
      });
      if (warehouseId !== "all") params.append("warehouseId", warehouseId);

      const response = await axiosInstance.get(
        `/api/inventory/reports/top-selling?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch top-selling products report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!report || !report.topProducts.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      report.topProducts.map((product, index) => ({
        "Rank": index + 1,
        "Item Name": product.itemName,
        "Category": product.category,
        "Total Sold": product.totalQuantitySold,
        "Total Orders": product.totalOrders,
        "Avg Per Order": product.averagePerOrder,
        "Current Stock": product.currentStock,
        "Stock Status": product.stockStatus,
        "Warehouses": product.warehouses.join(", "),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Top Selling Products");
    XLSX.writeFile(workbook, `top-selling-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.xlsx`);
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <div className="space-y-2">
          <Label>Top Items</Label>
          <Select value={limit} onValueChange={handleLimitChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
              <SelectItem value="100">Top 100</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.totalSalesMovements}</div>
                <p className="text-xs text-muted-foreground">Total Sales Movements</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {report.summary.totalQuantitySold}
                </div>
                <p className="text-xs text-muted-foreground">Total Units Sold</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{report.summary.uniqueProductsSold}</div>
                <p className="text-xs text-muted-foreground">Unique Products Sold</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Avg/Order</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales data found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  report.topProducts.map((product, index) => (
                    <TableRow key={product.itemId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Award className={cn(
                              "h-5 w-5",
                              index === 0 && "text-yellow-500",
                              index === 1 && "text-gray-400",
                              index === 2 && "text-orange-600"
                            )} />
                          )}
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">{product.totalQuantitySold}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{product.totalOrders}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{product.averagePerOrder}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          product.currentStock === 0 && "text-red-600",
                          product.currentStock > 0 && product.stockStatus === "low_stock" && "text-orange-600"
                        )}>
                          {product.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.stockStatus === "out_of_stock" ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : product.stockStatus === "low_stock" ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
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
        </>
      )}
    </div>
  );
}
