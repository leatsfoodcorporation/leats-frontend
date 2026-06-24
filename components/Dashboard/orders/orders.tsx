"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { OnlineOrders } from "./OnlineOrders";
import { OfflineOrdersList } from "./offline-orders-list";

export function Orders() {
  const { canView } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("online");

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/orders") {
      // Redirect to online orders tab by default
      router.replace("/dashboard/orders/online");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "online");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/orders/${value}`);
  };

  return (
    <div className="w-full p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with Tabs */}
        <div className="mb-6 flex items-center gap-5">
          <TabsList className="w-auto">
            {canView("online_orders") && <TabsTrigger value="online">Online Orders</TabsTrigger>}
            {canView("pos_orders") && <TabsTrigger value="pos">POS Orders</TabsTrigger>}
          </TabsList>
        </div>

        {/* Tab Contents */}
        {canView("online_orders") && <TabsContent value="online" className="mt-0 w-full">
          <OnlineOrders />
        </TabsContent>}
        {canView("pos_orders") && <TabsContent value="pos" className="mt-0 w-full">
          <OfflineOrdersList />
        </TabsContent>}
      </Tabs>
    </div>
  );
}
