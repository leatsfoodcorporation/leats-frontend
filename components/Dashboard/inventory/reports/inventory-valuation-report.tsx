"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, DollarSign } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

interface Warehouse {
  id: string;
  name: string;
}

interface ValuationReport {
  totalValue: number;
  totalItems: number;
  byCategory: Array<{
    category: string;
    items: number;
    units: number;
    value: number;
  }>;
  byWarehouse: Array<{
    warehouse: string;
    items: number;
    units: number;
    value: number;
  }>;
}

export default function InventoryValuationReport() {
  const [warehouseId, setWarehouseId] = useState("all");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currencySymbol = useCurrency();

  useEffect(() => {
    fetchWarehouses();
  }, []);

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
      const params = new URLSearchParams();
      if (warehouseId !== "all") {
        params.append("warehouseId", warehouseId);
      }

      const response = await axiosInstance.get(
        `/api/inventory/reports/valuation?${params}`
      );

      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch inventory valuation");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    const categoryHeaders = ["Category", "Items", "Units", "Value"];
    const categoryRows = report.byCategory.map((item) => [
      item.category,
      item.items,
      item.units,
      item.value.toFixed(2),
    ]);

    const warehouseHeaders = ["Warehouse", "Items", "Units", "Value"];
    const warehouseRows = report.byWarehouse.map((item) => [
      item.warehouse,
      item.items,
      item.units,
      item.value.toFixed(2),
    ]);

    const csv = [
      ["INVENTORY VALUATION REPORT"],
      [""],
      ["Total Value", report.totalValue.toFixed(2)],
      ["Total Items", report.totalItems],
      [""],
      ["BY CATEGORY"],
      categoryHeaders,
      ...categoryRows,
      [""],
      ["BY WAREHOUSE"],
      warehouseHeaders,
      ...warehouseRows,
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-valuation-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Warehouse</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
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
          {/* {report && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
            </Button>
          )} */}
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Total Inventory Value
                  </p>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {currencySymbol}
                    {report.totalValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{report.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Total Items in Inventory
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* By Category */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byCategory
                  .sort((a, b) => b.value - a.value)
                  .map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-right">{item.items}</TableCell>
                      <TableCell className="text-right">{item.units}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencySymbol}
                        {item.value.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {((item.value / report.totalValue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Warehouse */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation by Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byWarehouse
                  .sort((a, b) => b.value - a.value)
                  .map((item) => (
                    <TableRow key={item.warehouse}>
                      <TableCell className="font-medium">
                        {item.warehouse}
                      </TableCell>
                      <TableCell className="text-right">{item.items}</TableCell>
                      <TableCell className="text-right">{item.units}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencySymbol}
                        {item.value.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {((item.value / report.totalValue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
