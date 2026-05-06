"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import SuppliersList from "./suppliers/suppliers-list";
import BillsList from "./bills/bills-list";
import ExpensesList from "./expenses/expenses-list";
import PurchasesList from "./purchases/purchases-list";
import Reports from "./reports/reports"


export const PurchaseOrders = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("suppliers-list");

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/purchase-orders") {
      // Redirect to warehouse tab by default
      router.replace("/dashboard/purchase-orders/suppliers-list");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "suppliers-list");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "reports") {
      router.push(`/dashboard/purchase-orders/${value}?report=purchase-summary-report`);
    } else {
      router.push(`/dashboard/purchase-orders/${value}`);
    }
  };

  return (
    <div className="w-full p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with Tabs and Button */}
        <div className="mb-6 flex items-center gap-5">
          <TabsList className="w-auto">
            <TabsTrigger value="suppliers-list">Suppliers</TabsTrigger>
            <TabsTrigger value="purchases-list">Purchases</TabsTrigger>
            <TabsTrigger value="bills-list">Bills</TabsTrigger>
            <TabsTrigger value="expenses-list">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="suppliers-list" className="mt-0 w-full">
          <SuppliersList />
        </TabsContent>
        <TabsContent value="purchases-list" className="mt-0 w-full">
          <PurchasesList />
        </TabsContent>
        <TabsContent value="bills-list" className="mt-0 w-full">
          <BillsList />
        </TabsContent>
        <TabsContent value="expenses-list" className="mt-0 w-full">
          <ExpensesList />
        </TabsContent>
        <TabsContent value="reports" className="mt-0 w-full">
          <Reports />
        </TabsContent>
       
      </Tabs>
    </div>
  );
};
