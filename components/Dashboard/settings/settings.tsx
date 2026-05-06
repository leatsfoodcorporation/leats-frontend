"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailConfiguration } from "./emailconfiguration/email-configuration";
import { GeneralSettings } from "./general/general-settings";
import { PaymentGatewaySettings } from "./paymentgateway/payment-gateway-settings";
import { InvoiceSettings } from "./invoice/invoice-settings";
import { GSTSettings } from "./gst/gst-settings";
import { DeliveryZoneSettings } from "./delivery-zones/delivery-zone-settings";
import { DeliveryChargeSettings } from "@/components/Dashboard/settings/delivery-charge/delivery-charge-settings";
import { OrderScheduleSettingsComponent } from "@/components/Dashboard/settings/order-schedule/order-schedule-settings";

import { useEffect, useState } from "react";

export const Settings = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("general");

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/settings") {
      // Redirect to general tab by default
      router.replace("/dashboard/settings/general");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "general");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/settings/${value}`);
  };

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and configurations
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full max-w-6xl grid grid-cols-8">
          <TabsTrigger value="general">
            General
          </TabsTrigger>
          <TabsTrigger value="email-configuration">
            Email
          </TabsTrigger>
          <TabsTrigger value="payment-gateway">
            Payment
          </TabsTrigger>
          <TabsTrigger value="invoice">
            Invoice
          </TabsTrigger>
          <TabsTrigger value="gst">
            GST
          </TabsTrigger>
          <TabsTrigger value="delivery-zones">
            Zones
          </TabsTrigger>
          <TabsTrigger value="delivery-charge">
            Charges
          </TabsTrigger>
          <TabsTrigger value="order-schedule">
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 w-full">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="email-configuration" className="mt-6 w-full">
          <EmailConfiguration />
        </TabsContent>

        <TabsContent value="payment-gateway" className="mt-6 w-full">
          <PaymentGatewaySettings />
        </TabsContent>

        <TabsContent value="invoice" className="mt-6 w-full">
          <InvoiceSettings />
        </TabsContent>

        <TabsContent value="gst" className="mt-6 w-full">
          <GSTSettings />
        </TabsContent>

        <TabsContent value="delivery-zones" className="mt-6 w-full">
          <DeliveryZoneSettings />
        </TabsContent>

        <TabsContent value="delivery-charge" className="mt-6 w-full">
          <DeliveryChargeSettings />
        </TabsContent>

        <TabsContent value="order-schedule" className="mt-6 w-full">
          <OrderScheduleSettingsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
