"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, XCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface WarehouseAlertsProps {
  data: {
    outOfStock: number;
    lowStockAlerts: number;
    expiringItems: number;
    inventoryMismatch: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function WarehouseAlerts({ data, dateRange }: WarehouseAlertsProps) {
  const alerts = [
    {
      id: "1",
      type: "danger" as const,
      message: `Critical: ${data.outOfStock} items out of stock`,
      time: "25 mins ago",
    },
    {
      id: "2",
      type: "warning" as const,
      message: `Low stock alert: ${data.lowStockAlerts} items need restocking`,
      time: "10 mins ago",
    },
    {
      id: "3",
      type: "warning" as const,
      message: `${data.expiringItems} items expiring soon`,
      time: "2 hours ago",
    },
    {
      id: "4",
      type: "info" as const,
      message: "Shipment ready for dispatch",
      time: "1 hour ago",
    },
  ];
  
  // Generate date description
  const getDateDescription = () => {
    if (!dateRange) return "Recent notifications and warnings";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(dateRange.to);
    toDate.setHours(0, 0, 0, 0);
    
    // Check if selected date is today
    if (fromDate.getTime() === today.getTime() && toDate.getTime() === today.getTime()) {
      return "Recent notifications and warnings";
    }
    
    return "Stock alerts and notifications";
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Warehouse Alerts
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">{getDateDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {alert.type === "danger" && <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />}
                  {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />}
                  {alert.type === "info" && <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5" />}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{alert.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

