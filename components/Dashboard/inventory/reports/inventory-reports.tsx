"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, Package, TrendingUp, AlertTriangle, Award } from "lucide-react";
import DailyMovementReport from "./daily-movement-report";
import EODClosingStockReport from "./eod-closing-stock-report";
import StockAvailabilityReport from "./stock-availability-report";
import InventoryMovementReport from "./inventory-movement-report";
import ExpiryWastageReport from "./expiry-wastage-report";
import TopSellingReport from "./top-selling-report";

export default function InventoryReports() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get active tab from URL or default to stock-availability
  const activeTab = searchParams.get("tab") || "stock-availability";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="stock-availability" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stock Availability</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
          <TabsTrigger value="movement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Movement</span>
            <span className="sm:hidden">Move</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Expiry & Wastage</span>
            <span className="sm:hidden">Expiry</span>
          </TabsTrigger>
          <TabsTrigger value="top-selling" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Top Selling</span>
            <span className="sm:hidden">Top</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Movement</span>
            <span className="sm:hidden">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="eod" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">EOD Closing</span>
            <span className="sm:hidden">EOD</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock-availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Availability Report</CardTitle>
              <CardDescription>
                View current stock levels across all warehouses and categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockAvailabilityReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement Report</CardTitle>
              <CardDescription>
                Track stock movements over a selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryMovementReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiry & Wastage Report</CardTitle>
              <CardDescription>
                Monitor expiring items and track wastage records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpiryWastageReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-selling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top-Selling Products Report</CardTitle>
              <CardDescription>
                Identify best-performing products based on sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopSellingReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Movement Report</CardTitle>
              <CardDescription>
                Track all stock movements for a specific day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyMovementReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eod" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>End of Day Closing Stock</CardTitle>
              <CardDescription>
                Complete inventory snapshot with valuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EODClosingStockReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
