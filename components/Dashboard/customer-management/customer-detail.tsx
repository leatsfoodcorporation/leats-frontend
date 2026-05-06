"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Store,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { Customer } from "@/services/customerService";
import { customerService } from "@/services/customerService";
import { useCurrency } from "@/hooks/useCurrency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  averageOrderValue: number;
  recentOrders: CustomerOrderData[];
}

interface CustomerOrderData {
  id: string;
  orderNumber: string;
  invoiceNumber: string | null;
  orderType: string;
  subtotal: number;
  tax: number;
  discount: number;
  couponDiscount?: number; // For online orders
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  totalQuantity: number;
  orderDate: string;
  completedAt: string | null;
}

// Helper function to safely format dates
const safeFormatDate = (
  dateStr: string | undefined | null,
  formatStr: string = "MMM dd, yyyy"
): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch {
    return "-";
  }
};

interface CustomerDetailProps {
  customer: Customer;
}

export default function CustomerDetail({ customer }: CustomerDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrency();
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [orders, setOrders] = useState<CustomerOrderData[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<CustomerOrderData[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOnlineOrders, setLoadingOnlineOrders] = useState(true);
  const [activeTab, setActiveTab] = useState("all-orders");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get active tab from URL search params
  useEffect(() => {
    const tab = searchParams.get("ref");
    if (tab && ["all-orders", "online", "pos"].includes(tab)) {
      setActiveTab(tab);
    } else {
      // Default to all-orders and update URL
      setActiveTab("all-orders");
      // Set URL param if not present
      if (!tab) {
        const currentPath = window.location.pathname;
        window.history.replaceState(null, "", `${currentPath}?ref=all-orders`);
      }
    }
  }, [searchParams]);

  // Fetch customer analytics and orders
  const fetchCustomerData = useCallback(async () => {
    try {
      // Fetch analytics
      setLoadingAnalytics(true);
      const analyticsData = await customerService.getAnalytics(customer.id);
      setAnalytics(analyticsData.analytics as unknown as CustomerAnalytics);
      setLoadingAnalytics(false);

      // Fetch POS orders
      setLoadingOrders(true);
      const ordersData = await customerService.getOrders(customer.id, 1, 50);
      setOrders(ordersData.orders as unknown as CustomerOrderData[]);
      setLoadingOrders(false);

      // Fetch online orders
      setLoadingOnlineOrders(true);
      try {
        const onlineOrdersData = await customerService.getOnlineOrders(customer.id, 1, 50);
        setOnlineOrders(onlineOrdersData.orders as unknown as CustomerOrderData[]);
      } catch (error) {
        console.error("Error fetching online orders:", error);
        setOnlineOrders([]);
      }
      setLoadingOnlineOrders(false);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to load customer data");
      setLoadingAnalytics(false);
      setLoadingOrders(false);
      setLoadingOnlineOrders(false);
    }
  }, [customer.id]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with search params
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?ref=${value}`, { scroll: false });
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === "all-orders") {
      // Merge POS and online orders, then sort by date
      const allOrders = [...orders, ...onlineOrders];
      return allOrders.sort((a, b) => 
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
    } else if (activeTab === "online") {
      return onlineOrders;
    } else if (activeTab === "pos") {
      return orders;
    }
    return [];
  };

  const filteredOrders = getFilteredOrders();
  const onlineOrdersCount = onlineOrders.length;
  const posOrdersCount = orders.length;
  const allOrdersCount = orders.length + onlineOrders.length;

  return (
    <div className="flex-1 overflow-auto bg-muted/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Customer Profile Card */}
        <div className="border rounded-lg bg-white shadow-sm print:shadow-none print:border-0">
          {/* Profile Header */}
          <div className="p-8 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="size-24 border-4 border-white shadow-lg">
                  <AvatarImage src={customer.image} alt={customer.name} />
                  <AvatarFallback className="text-2xl font-bold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{customer.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="size-4" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="size-4" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>Joined {safeFormatDate(customer.joinedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Lifetime Value
                </div>
                {loadingAnalytics ? (
                  <div className="flex items-center justify-end gap-2">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    {currencySymbol}
                    {(analytics?.totalSpent || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-8 grid grid-cols-3 gap-6 border-b bg-muted/20">
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  TOTAL ORDERS
                </div>
                <ShoppingBag className="size-5 text-primary" />
              </div>
              {loadingAnalytics ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {analytics?.totalOrders || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {orders.length} orders
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  AVERAGE ORDER
                </div>
                <ShoppingBag className="size-5 text-blue-500" />
              </div>
              {loadingAnalytics ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {currencySymbol}
                    {(analytics?.averageOrderValue || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    per order
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">LAST ORDER</div>
                <Calendar className="size-5 text-green-500" />
              </div>
              {loadingAnalytics ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-xl font-bold">
                    {analytics?.lastOrderDate
                      ? safeFormatDate(analytics.lastOrderDate, "MMM dd, yyyy")
                      : "No orders"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics?.lastOrderDate
                      ? safeFormatDate(analytics.lastOrderDate, "hh:mm a")
                      : "-"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Purchase History */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="size-5 text-primary" />
              <h3 className="text-xl font-semibold">Purchase History</h3>
            </div>

            {loadingOrders || loadingOnlineOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-muted-foreground">
                    Loading orders...
                  </span>
                </div>
              </div>
            ) : allOrdersCount === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">No orders yet</p>
                <p className="text-sm mt-1">
                  This customer hasn&apos;t made any purchases
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all-orders">
                    All Orders ({allOrdersCount})
                  </TabsTrigger>
                  <TabsTrigger value="online">
                    Online ({onlineOrdersCount})
                  </TabsTrigger>
                  <TabsTrigger value="pos">
                    POS ({posOrdersCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all-orders" className="mt-0">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No orders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="online" className="mt-0">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No online orders</p>
                      <p className="text-sm mt-1">
                        This customer hasn&apos;t made any online purchases
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pos" className="mt-0">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Store className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No POS orders</p>
                      <p className="text-sm mt-1">
                        This customer hasn&apos;t made any in-store purchases
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Card Component (supports both online and POS orders)
function OrderCard({
  order,
  currencySymbol,
}: {
  order: CustomerOrderData;
  currencySymbol: string;
}) {
  const isOnline = order.orderType === "online";

  return (
    <div className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center ${
            isOnline ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
          }`}>
            {isOnline ? <ShoppingBag className="size-5" /> : <Store className="size-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                {isOnline ? "Online" : "POS"}
              </Badge>
              <span className="font-semibold">{order.orderNumber}</span>
              {order.invoiceNumber && (
                <span className="text-xs text-muted-foreground">
                  ({order.invoiceNumber})
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {safeFormatDate(order.orderDate, "MMM dd, yyyy")}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {currencySymbol}
            {order.total.toFixed(2)}
          </div>
          <Badge variant="default" className="mt-1">
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Items:</span>
          <span className="ml-2 font-medium">{order.itemCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Quantity:</span>
          <span className="ml-2 font-medium">{order.totalQuantity}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="ml-2 font-medium">
            {currencySymbol}
            {order.subtotal.toFixed(2)}
          </span>
        </div>
        {/* Show discount for all orders */}
        {order.discount > 0 && (
          <div>
            <span className="text-muted-foreground">Discount:</span>
            <span className="ml-2 font-medium text-green-600">
              -{currencySymbol}
              {order.discount.toFixed(2)}
            </span>
          </div>
        )}
        {/* Show coupon discount only for online orders */}
        {isOnline && order.couponDiscount && order.couponDiscount > 0 && (
          <div>
            <span className="text-muted-foreground">Coupon Discount:</span>
            <span className="ml-2 font-medium text-green-600">
              -{currencySymbol}
              {order.couponDiscount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="size-4 shrink-0" />
            <span>Payment Method:</span>
          </div>
          <span className="font-medium uppercase">{order.paymentMethod}</span>
        </div>
      </div>
    </div>
  );
}
