"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import OnlineSalesList from "./online-sales/online-sales-list";
import PosSalesList from "./pos-sales/pos-sales-list";
import SalesReports from "../reports/sales-reports";

export const Sales = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("online-sales");

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/finances/sales") {
      router.replace("/dashboard/finances/sales/online-sales");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "online-sales");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "reports") {
      router.push(`/dashboard/finances/sales/${value}?report=sales-summary`);
    } else {
      router.push(`/dashboard/finances/sales/${value}`);
    }
  };

  return (
    <div className="w-full p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with Tabs */}
        <div className="mb-6 flex items-center gap-5">
          <TabsList className="w-auto">
            <TabsTrigger value="online-sales">Online Sales</TabsTrigger>
            <TabsTrigger value="pos-sales">POS Sales</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="online-sales" className="mt-0 w-full">
          <OnlineSalesList />
        </TabsContent>
        <TabsContent value="pos-sales" className="mt-0 w-full">
          <PosSalesList />
        </TabsContent>
        <TabsContent value="reports" className="mt-0 w-full">
          <SalesReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};
