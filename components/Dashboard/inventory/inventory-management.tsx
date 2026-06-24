"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import Warehouse from "./warehouse/warehouse-list";
import StockAdjustment from "./stock-adjustment/stock-adjustment";
import InventoryReports from "./reports/inventory-reports";
import AddItemButton from "./items/add-item-button";
import Processing from "./processing/processing-page";

export const InventoryManagement = () => {
  const { canView } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("general");

  // Get tab from URL path
  useEffect(() => { 
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/inventory-management") {
      // Redirect to warehouse tab by default
      router.replace("/dashboard/inventory-management/warehouse");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "warehouse");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/inventory-management/${value}`);
  };

  return (
    <div className="w-full p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with Tabs and Button */}
        <div className="mb-6 flex items-center gap-5">
          <TabsList className="w-auto">
            {canView("warehouse") && <TabsTrigger value="warehouse">Warehouse</TabsTrigger>}
            {canView("processing") && <TabsTrigger value="processing">Processing</TabsTrigger>}
            {canView("stock_adjustment") && <TabsTrigger value="stock-adjustment">Stock Adjustment</TabsTrigger>}
            {canView("inventory_reports") && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          <AddItemButton>Add Items</AddItemButton>
        </div>

        {/* Tab Contents */}
        {canView("warehouse") && <TabsContent value="warehouse" className="mt-0 w-full">
          <Warehouse />
        </TabsContent>}

        {canView("processing") && <TabsContent value="processing" className="mt-0 w-full">
          <Processing />
        </TabsContent>}

        {canView("stock_adjustment") && <TabsContent value="stock-adjustment" className="mt-0 w-full">
          <StockAdjustment />
        </TabsContent>}

        {canView("inventory_reports") && <TabsContent value="reports" className="mt-0 w-full">
          <InventoryReports />
        </TabsContent>}
      </Tabs>
    </div>
  );
};
