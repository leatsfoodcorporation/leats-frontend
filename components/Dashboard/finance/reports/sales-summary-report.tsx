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
import { Loader2, Download, CalendarIcon, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
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

export default function SalesSummaryReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrency();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [financialYear, setFinancialYear] = useState(searchParams.get("financialYear") || "all");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") || "all");
  const [orderType, setOrderType] = useState(searchParams.get("orderType") || "all");
  
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [summary, setSummary] = useState<{
    totalOrders: number;
    posOrders: number;
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
    
    // Set default date range (last 1 year to capture all sales)
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1); // Go back 1 year
    
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

  const handleFinancialYearChange = (value: string) => {
    setFinancialYear(value);
    updateSearchParams("financialYear", value);
  };

  const handlePaymentStatusChange = (value: string) => {
    setPaymentStatus(value);
    updateSearchParams("paymentStatus", value);
  };

  const handleOrderTypeChange = (value: string) => {
    setOrderType(value);
    updateSearchParams("orderType", value);
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
        page: number;
        limit: number;
        financialYear?: string;
        paymentStatus?: string;
        orderType?: 'pos' | 'online';
      } = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: 1,
        limit: 1000, // Get all for report
      };

      if (financialYear !== "all") filters.financialYear = financialYear;
      if (paymentStatus !== "all") filters.paymentStatus = paymentStatus;
      if (orderType !== "all") filters.orderType = orderType as 'pos' | 'online';

      const response = await financeService.getAllSales(filters);
      
      if (response.success) {
        setSales(response.data);
        setSummary(response.summary);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch sales summary report");
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
        "Channel": sale.source,
        "Date": format(new Date(sale.saleDate), "dd/MM/yyyy"),
        "Time": format(new Date(sale.saleDate), "HH:mm:ss"),
        "Customer Name": sale.customerName || "N/A",
        "Customer Phone": sale.customerPhone || "",
        "Customer Email": sale.customerEmail || "",
        "Items Count": sale.itemCount,
        "Subtotal": sale.subtotal,
        "Tax Amount": sale.tax,
        "Discount": sale.discount,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Summary");
    XLSX.writeFile(
      workbook,
      `sales-summary-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.xlsx`
    );

    toast.success("Sales summary exported successfully");
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
          <Label className="text-sm">Financial Year</Label>
          <Select value={financialYear} onValueChange={handleFinancialYearChange}>
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
          <Label className="text-sm">Channel</Label>
          <Select value={orderType} onValueChange={handleOrderTypeChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Payment Status</Label>
          <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
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
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                POS: {summary.posOrders} | Online: {summary.onlineOrders}
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
                {formatCurrency(summary.totalOrders > 0 ? summary.totalAmount / summary.totalOrders : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per order
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
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No sales found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.orderNumber}</TableCell>
                      <TableCell>{format(new Date(sale.saleDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.source}</Badge>
                      </TableCell>
                      <TableCell>{sale.customerName || "N/A"}</TableCell>
                      <TableCell className="text-right">{sale.itemCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
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
                {sales.length} sales
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
