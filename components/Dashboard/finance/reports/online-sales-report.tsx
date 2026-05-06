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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CalendarIcon, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
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
import { financeService, type SalesOrder } from "@/services/financeService";
import { useCurrency } from "@/hooks/useCurrency";
import * as XLSX from "xlsx";

export default function OnlineSalesReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrency();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [financialYear, setFinancialYear] = useState(searchParams.get("financialYear") || "all");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") || "all");
  const [orderStatus, setOrderStatus] = useState(searchParams.get("orderStatus") || "all");
  
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [summary, setSummary] = useState<{
    totalOrders: number;
    onlineOrders: number;
    totalAmount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    fetchAvailableYears();
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    
    setStartDate(startParam ? new Date(startParam) : start);
    setEndDate(endParam ? new Date(endParam) : end);
  }, []);

  const fetchAvailableYears = async () => {
    try {
      const response = await financeService.getSalesByFinancialYear();
      if (response.success && response.data.length > 0) {
        const years = response.data.map((item) => item.financialYear).filter(Boolean);
        setAvailableYears(years);
      }
    } catch (error) {
      console.error("Error fetching financial years:", error);
    }
  };

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsLoading(true);
      const filters: {
        startDate: string;
        endDate: string;
        orderType: 'online';
        page: number;
        limit: number;
        financialYear?: string;
        paymentStatus?: string;
      } = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        orderType: "online",
        page: 1,
        limit: 1000,
      };

      if (financialYear !== "all") filters.financialYear = financialYear;
      if (paymentStatus !== "all") filters.paymentStatus = paymentStatus;

      const response = await financeService.getAllSales(filters);
      
      if (response.success) {
        let filteredSales = response.data;
        
        // Apply order status filter on frontend
        if (orderStatus !== "all") {
          filteredSales = filteredSales.filter(sale => sale.orderStatus === orderStatus);
        }
        
        setSales(filteredSales);
        setSummary(response.summary);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch online sales report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!sales || !sales.length) {
      toast.error("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      sales.map((sale) => ({
        "Order Number": sale.orderNumber,
        "Invoice Number": sale.invoiceNumber,
        "Date": format(new Date(sale.saleDate), "dd/MM/yyyy"),
        "Customer Name": sale.customerName || "Guest",
        "Customer Email": sale.customerEmail || "",
        "Customer Phone": sale.customerPhone || "",
        "Delivery City": sale.deliveryAddress?.city || "",
        "Delivery State": sale.deliveryAddress?.state || "",
        "Delivery Pincode": sale.deliveryAddress?.pincode || "",
        "Items Count": sale.itemCount,
        "Subtotal": sale.subtotal,
        "Tax Rate": sale.taxRate,
        "Tax Amount": sale.tax,
        "Discount": sale.discount,
        "Coupon Code": sale.couponCode || "",
        "Coupon Discount": sale.couponDiscount || 0,
        "Shipping Charge": sale.shippingCharge || 0,
        "Total Amount": sale.total,
        "Payment Method": sale.paymentMethod,
        "Payment Status": sale.paymentStatus,
        "Order Status": sale.orderStatus,
        "Financial Year": sale.financialYear || "",
        "Accounting Period": sale.accountingPeriod || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Online Sales");
    XLSX.writeFile(
      workbook,
      `online-sales-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.xlsx`
    );

    toast.success("Online sales exported successfully");
  };

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sales.slice(startIndex, endIndex);

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

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "outline", label: "Confirmed" },
      shipped: { variant: "outline", label: "Shipped" },
      delivered: { variant: "default", label: "Delivered" },
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
                onSelect={(date) => {
                  setStartDate(date);
                  if (date) updateSearchParams("startDate", format(date, "yyyy-MM-dd"));
                }}
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
                onSelect={(date) => {
                  setEndDate(date);
                  if (date) updateSearchParams("endDate", format(date, "yyyy-MM-dd"));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Financial Year</Label>
          <Select value={financialYear} onValueChange={(value) => {
            setFinancialYear(value);
            updateSearchParams("financialYear", value);
          }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  FY {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Payment Status</Label>
          <Select value={paymentStatus} onValueChange={(value) => {
            setPaymentStatus(value);
            updateSearchParams("paymentStatus", value);
          }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Order Status</Label>
          <Select value={orderStatus} onValueChange={(value) => {
            setOrderStatus(value);
            updateSearchParams("orderStatus", value);
          }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
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
      {summary && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={exportToExcel} className="h-10">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="size-4 text-muted-foreground" />
                Online Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.onlineOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total online orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.onlineOrders > 0 ? summary.totalAmount / summary.onlineOrders : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per online order
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Table */}
      {summary && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Shipping</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No online sales found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.orderNumber}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sale.invoiceNumber}
                      </TableCell>
                      <TableCell>{format(new Date(sale.saleDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div>
                          <div>{sale.customerName || "Guest"}</div>
                          {sale.customerEmail && (
                            <div className="text-xs text-muted-foreground">
                              {sale.customerEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{sale.itemCount}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.subtotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.shippingCharge || 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{getPaymentStatusBadge(sale.paymentStatus)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {sale.paymentMethod}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getOrderStatusBadge(sale.orderStatus)}</TableCell>
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
                Showing {startIndex + 1} to {Math.min(endIndex, sales.length)} of{" "}
                {sales.length} online sales
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
