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
import { Loader2, Download, AlertTriangle, Clock } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
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
import { format } from "date-fns";

interface Warehouse {
  id: string;
  name: string;
}

interface ExpiryItem {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  category: string;
  warehouse: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  urgency: string;
  estimatedValue: number;
  uom: string;
}

interface WastageRecord {
  id: string;
  itemName: string;
  quantity: number;
  reason: string;
  createdAt: string;
  notes: string | null;
}

interface ExpiryWastageReport {
  summary: {
    expiringItems: number;
    criticalItems: number;
    warningItems: number;
    totalExpiryValue: number;
    totalWastageRecords: number;
    wastageByReason: Array<{
      reason: string;
      count: number;
      quantity: number;
    }>;
  };
  expiryReport: ExpiryItem[];
  wastageRecords: WastageRecord[];
}

export default function ExpiryWastageReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrency();

  const [warehouseId, setWarehouseId] = useState(
    searchParams.get("warehouse") || "all"
  );
  const [daysAhead, setDaysAhead] = useState(
    searchParams.get("daysAhead") || "30"
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<ExpiryWastageReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDaysAheadChange = (value: string) => {
    setDaysAhead(value);
    updateSearchParams("daysAhead", value);
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/inventory/warehouses?status=active"
      );
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
      const params = new URLSearchParams({ daysAhead });
      if (warehouseId !== "all") params.append("warehouseId", warehouseId);

      const response = await axiosInstance.get(
        `/api/inventory/reports/expiry-wastage?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch expiry & wastage report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!report) return;

    const workbook = XLSX.utils.book_new();

    // Expiry Report Sheet
    if (report.expiryReport.length > 0) {
      const expirySheet = XLSX.utils.json_to_sheet(
        report.expiryReport.map((item) => ({
          "Item Name": item.itemName,
          SKU: item.itemCode || "N/A",
          Category: item.category,
          Warehouse: item.warehouse,
          Quantity: item.quantity,
          UOM: item.uom,
          "Expiry Date": format(new Date(item.expiryDate), "PPP"),
          "Days Until Expiry": item.daysUntilExpiry,
          Urgency: item.urgency,
          "Estimated Value": item.estimatedValue.toFixed(2),
        }))
      );
      XLSX.utils.book_append_sheet(workbook, expirySheet, "Expiring Items");
    }

    // Wastage Report Sheet
    if (report.wastageRecords.length > 0) {
      const wastageSheet = XLSX.utils.json_to_sheet(
        report.wastageRecords.map((record) => ({
          "Item Name": record.itemName,
          Quantity: record.quantity,
          Reason: record.reason,
          Date: format(new Date(record.createdAt), "PPP"),
          Notes: record.notes || "N/A",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, wastageSheet, "Wastage Records");
    }

    XLSX.writeFile(
      workbook,
      `expiry-wastage-${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Report exported successfully");
  };

  const totalPages = report
    ? Math.ceil(report.expiryReport.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = report
    ? report.expiryReport.slice(startIndex, endIndex)
    : [];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label>Days Ahead</Label>
          <Select value={daysAhead} onValueChange={handleDaysAheadChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 Days</SelectItem>
              <SelectItem value="15">Next 15 Days</SelectItem>
              <SelectItem value="30">Next 30 Days</SelectItem>
              <SelectItem value="60">Next 60 Days</SelectItem>
              <SelectItem value="90">Next 90 Days</SelectItem>
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
                <div className="text-2xl font-bold">
                  {report.summary.expiringItems}
                </div>
                <p className="text-xs text-muted-foreground">Expiring Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {report.summary.criticalItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical (≤7 days)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {report.summary.warningItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  Warning (≤15 days)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {currencySymbol}
                  {report.summary.totalExpiryValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">At Risk Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {report.summary.totalWastageRecords}
                </div>
                <p className="text-xs text-muted-foreground">Wastage Records</p>
              </CardContent>
            </Card>
          </div>

          {/* Wastage by Reason */}
          {report.summary.wastageByReason.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Wastage by Reason</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.summary.wastageByReason.map((item) => (
                    <div
                      key={item.reason}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">{item.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} records
                        </p>
                      </div>
                      <Badge variant="secondary">{item.quantity} units</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiring Items Table */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Expiring Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Days Left</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No items expiring in the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.itemName}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.itemCode || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.uom}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.expiryDate), "PPP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{item.daysUntilExpiry} days</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {currencySymbol}
                        {item.estimatedValue.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        {item.urgency === "critical" ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Critical
                          </Badge>
                        ) : item.urgency === "warning" ? (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Warning
                          </Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
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
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, report.expiryReport.length)} of{" "}
                {report.expiryReport.length} items
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
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
