"use client";
import { usePermissions } from "@/hooks/usePermissions";

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
          {canView("settings_general") && <TabsTrigger value="general">
            General
          </TabsTrigger>}
          {canView("settings_email") && <TabsTrigger value="email-configuration">
            Email
          </TabsTrigger>}
          {canView("settings_payment") && <TabsTrigger value="payment-gateway">
            Payment
          </TabsTrigger>}
          {canView("settings_invoice") && <TabsTrigger value="invoice">
            Invoice
          </TabsTrigger>}
          {canView("settings_gst") && <TabsTrigger value="gst">
            GST
          </TabsTrigger>}
          {canView("settings_zones") && <TabsTrigger value="delivery-zones">
            Zones
          </TabsTrigger>}
          {canView("settings_charge") && <TabsTrigger value="delivery-charge">
            Charges
          </TabsTrigger>}
          {canView("settings_schedule") && <TabsTrigger value="order-schedule">
            Schedule
          </TabsTrigger>}
        </TabsList>

        {canView("settings_general") && <TabsContent value="general" className="mt-6 w-full">
          <GeneralSettings />
        </TabsContent>}

        {canView("settings_email") && <TabsContent value="email-configuration" className="mt-6 w-full">
          <EmailConfiguration />
        </TabsContent>}

        {canView("settings_payment") && <TabsContent value="payment-gateway" className="mt-6 w-full">
          <PaymentGatewaySettings />
        </TabsContent>}

        {canView("settings_invoice") && <TabsContent value="invoice" className="mt-6 w-full">
          <InvoiceSettings />
        </TabsContent>}

        {canView("settings_gst") && <TabsContent value="gst" className="mt-6 w-full">
          <GSTSettings />
        </TabsContent>}

        {canView("settings_zones") && <TabsContent value="delivery-zones" className="mt-6 w-full">
          <DeliveryZoneSettings />
        </TabsContent>}

        {canView("settings_charge") && <TabsContent value="delivery-charge" className="mt-6 w-full">
          <DeliveryChargeSettings />
        </TabsContent>}

        {canView("settings_schedule") && <TabsContent value="order-schedule" className="mt-6 w-full">
          <OrderScheduleSettingsComponent />
        </TabsContent>}
      </Tabs>
    </div>
  );
};
