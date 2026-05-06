"use client";

import { ShoppingCart, DollarSign, TrendingUp, XCircle, TrendingDown, Activity, PackageCheck } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface KPICardsProps {
  data: {
    todaysOrders: number;
    todaysRevenue: number;
    avgOrderValue: number;
    onTimeDelivery: number;
    cancelledOrders: number;
    deliveredOrders: number; // NEW: Total delivered orders count
    warehouseStatus: {
      total: number;
      online: number;
      offline: number;
    };
    trends: {
      orders: number;
      revenue: number;
      avgOrderValue: number;
    };
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Professional KPI Card Component with 3-color palette
function KpiCard({
  label,
  value,
  delta,
  trend = 'flat',
  caption,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  caption: string;
  icon: React.ReactNode;
}) {
  const isUp = trend === 'up';
  const isDown = trend === 'down';
  const DeltaIcon = isUp ? TrendingUp : isDown ? TrendingDown : Activity;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:shadow-md transition-shadow">
      <span className="pointer-events-none absolute -right-6 -top-6 inline-flex h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/30" />
      <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30" />
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{caption}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2">
            <div className="text-blue-600 dark:text-blue-400">{icon}</div>
          </div>
          {delta !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isUp && "text-teal-600 dark:text-teal-400",
                isDown && "text-slate-500 dark:text-slate-400",
                !isUp && !isDown && "text-slate-500 dark:text-slate-400"
              )}
            >
              <DeltaIcon className="h-3 w-3" />
              {delta > 0 ? '+' : ''}{delta}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KPICards({ data, dateRange }: KPICardsProps) {
  const currencySymbol = useCurrency();
  
  // Generate date label
  const getDateLabel = () => {
    if (!dateRange) return "TODAY'S";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(dateRange.to);
    toDate.setHours(0, 0, 0, 0);
    
    // Check if selected date is today
    if (fromDate.getTime() === today.getTime() && toDate.getTime() === today.getTime()) {
      return "TODAY'S";
    }
    
    const from = format(dateRange.from, "MMM dd");
    const to = format(dateRange.to, "MMM dd, yyyy");
    
    // Check if same day
    if (format(dateRange.from, "yyyy-MM-dd") === format(dateRange.to, "yyyy-MM-dd")) {
      return format(dateRange.from, "MMM dd").toUpperCase();
    }
    
    return `${from} - ${to}`.toUpperCase();
  };
  
  const dateLabel = getDateLabel();

  // Determine trend direction based on delta value
  const getTrend = (delta: number): 'up' | 'down' | 'flat' => {
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'flat';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        label={`${dateLabel} ORDERS`}
        value={data.todaysOrders}
        delta={data.trends.orders}
        trend={getTrend(data.trends.orders)}
        caption="Active orders"
        icon={<ShoppingCart className="w-4 h-4" />}
      />

      <KpiCard
        label={`${dateLabel} REVENUE`}
        value={`${currencySymbol}${data.todaysRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        delta={data.trends.revenue}
        trend={getTrend(data.trends.revenue)}
        caption="Total sales revenue"
        icon={<DollarSign className="w-4 h-4" />}
      />

      <KpiCard
        label="AVERAGE ORDER VALUE"
        value={`${currencySymbol}${data.avgOrderValue.toFixed(2)}`}
        delta={data.trends.avgOrderValue}
        trend={getTrend(data.trends.avgOrderValue)}
        caption="Per order average"
        icon={<TrendingUp className="w-4 h-4" />}
      />

      <KpiCard
        label="DELIVERED ORDERS"
        value={data.deliveredOrders}
        caption="Successfully delivered"
        icon={<PackageCheck className="w-4 h-4" />}
      />

      <KpiCard
        label="CANCELLED ORDERS"
        value={data.cancelledOrders}
        caption="Cancelled"
        icon={<XCircle className="w-4 h-4" />}
      />
    </div>
  );
}
