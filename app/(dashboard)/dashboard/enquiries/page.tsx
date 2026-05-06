"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkOrdersList from "@/components/Dashboard/enquiries/bulk-orders-list";
import CateringServicesList from "@/components/Dashboard/enquiries/catering-services-list";
import { Package, UtensilsCrossed } from "lucide-react";

function EnquiriesContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "bulk-orders";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enquiries</h1>
        <p className="text-muted-foreground">
          Manage bulk order and catering service enquiries from customers
        </p>
      </div>

      <Tabs value={activeTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger 
            value="bulk-orders" 
            className="flex items-center gap-2"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", "bulk-orders");
              params.delete("search");
              params.delete("page");
              window.history.pushState(null, "", `?${params.toString()}`);
            }}
          >
            <Package className="size-4" />
            <span>Bulk Orders</span>
          </TabsTrigger>
          <TabsTrigger 
            value="catering-services" 
            className="flex items-center gap-2"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", "catering-services");
              params.delete("search");
              params.delete("page");
              window.history.pushState(null, "", `?${params.toString()}`);
            }}
          >
            <UtensilsCrossed className="size-4" />
            <span>Catering Services</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-orders" className="space-y-4">
          <BulkOrdersList />
        </TabsContent>

        <TabsContent value="catering-services" className="space-y-4">
          <CateringServicesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnquiriesContent />
    </Suspense>
  );
}
