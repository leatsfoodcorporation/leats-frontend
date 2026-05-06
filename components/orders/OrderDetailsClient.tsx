"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { getOrderByNumber, Order } from "@/services/orderService";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import {
  IconPackage,
  IconTruck,
  IconCheck,
  IconX,
  IconClock,
  IconChevronLeft,
  IconReceipt,
  IconMapPin,
  IconPhone,
  IconStar,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import RatingModal from "@/components/orders/RatingModal";
// TODO: Enable real-time order tracking in future
// import { useSocket } from "@/components/providers/socket-provider";
// import { subscribeToOrderEvents, unsubscribeFromOrderEvents } from "@/lib/socket/socketClient";

interface OrderDetailsClientProps {
  orderNumber: string;
}

interface DeliveryPartner {
  id: string;
  partnerId?: string;
  name: string;
  phone: string;
}

interface OrderWithPartner extends Order {
  deliveryPartner?: DeliveryPartner;
  deliveryPartnerId?: string;
  deliveryAssignAt?: string;
  partnerRating?: number;
  partnerRatingComment?: string;
  ratedAt?: string;
}

export default function OrderDetailsClient({
  orderNumber,
}: OrderDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthContext();
  const currencySymbol = useCurrency();
  const [order, setOrder] = useState<OrderWithPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // TODO: Enable real-time connection status in future
  // const { isConnected } = useSocket();
  
  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  // TODO: Enable real-time delivery updates in future
  // // Real-time delivery update handler
  // const handleDeliveryUpdate = useCallback((data: {
  //   orderId: string;
  //   status: string;
  //   timestamp: Date;
  // }) => {
  //   if (order && data.orderId === order.id) {
  //     setOrder(prev => prev ? { ...prev, orderStatus: data.status } : null);
  //     toast.info(`Order status updated: ${data.status}`);
  //   }
  // }, [order]);

  // // Subscribe to real-time order tracking
  // useEffect(() => {
  //   if (order?.id && isConnected) {
  //     subscribeToOrderEvents(order.id, {
  //       onDeliveryUpdate: handleDeliveryUpdate,
  //     });

  //     return () => {
  //       unsubscribeFromOrderEvents(order.id);
  //     };
  //   }
  // }, [order?.id, isConnected, handleDeliveryUpdate]);

  const isActiveOrder = useCallback((status?: string) => {
    return status && !["delivered", "cancelled"].includes(status);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user?.id) {
      toast.error("Please login to view order details");
      router.push("/signin?redirect=/my-orders");
      return;
    }

    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, authLoading, orderNumber]);

  // Auto-poll every 10s for active orders
  useEffect(() => {
    if (!order || !isActiveOrder(order.orderStatus)) return;

    const interval = setInterval(() => {
      silentRefresh();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderStatus]);

  // Refresh when browser tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && order && isActiveOrder(order.orderStatus)) {
        silentRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderStatus]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderByNumber(orderNumber, user!.id);

      if (response.data.userId !== user?.id) {
        toast.error("Order not found");
        router.push("/my-orders");
        return;
      }

      setOrder(response.data);
    } catch (error) {
      console.error("Error loading order:", error);
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        toast.error("Order not found");
        router.push("/my-orders");
      } else {
        toast.error("Failed to load order details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Silent refresh for polling (no loading state)
  const silentRefresh = async () => {
    try {
      if (!user?.id) return;
      const response = await getOrderByNumber(orderNumber, user.id);
      if (response.data.userId === user.id) {
        setOrder(response.data);
      }
    } catch {
      // Silent fail for background polling
    }
  };

  const handleRateOrder = () => {
    setRatingModalOpen(true);
  };

  const handleRatingSuccess = () => {
    loadOrder(); // Reload order to show updated rating
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed":
      case "packing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <IconCheck size={20} />;
      case "shipped":
        return <IconTruck size={20} />;
      case "confirmed":
      case "packing":
        return <IconPackage size={20} />;
      case "cancelled":
        return <IconX size={20} />;
      default:
        return <IconClock size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderTimeline = () => {
    if (!order) return [];

    // If order is cancelled, show only placed and cancelled
    if (order.orderStatus === "cancelled") {
      return [
        {
          status: "Order Placed",
          date: order.createdAt,
          completed: true,
          icon: IconReceipt,
        },
        {
          status: "Cancelled",
          date: order.cancelledAt || order.updatedAt,
          completed: true,
          icon: IconX,
        },
      ];
    }

    // Define the order status hierarchy
    const statusHierarchy = [
      "pending",
      "confirmed",
      "packing",
      "shipped",
      "delivered",
    ];
    const currentStatusIndex = statusHierarchy.indexOf(order.orderStatus);

    // Build complete timeline with all statuses
    const timeline = [
      {
        status: "Order Placed",
        date: order.createdAt,
        completed: true,
        icon: IconReceipt,
      },
      {
        status: "Order Confirmed",
        date: order.confirmedAt,
        completed: currentStatusIndex >= 1,
        icon: IconCheck,
      },
      {
        status: "Packing",
        date: order.updatedAt, // Use updatedAt as fallback since packingAt doesn't exist
        completed: currentStatusIndex >= 2,
        icon: IconPackage,
      },
      {
        status: "Shipped",
        date: order.shippedAt,
        completed: currentStatusIndex >= 3,
        icon: IconTruck,
      },
      {
        status: "Delivered",
        date: order.deliveredAt,
        completed: currentStatusIndex >= 4,
        icon: IconCheck,
      },
    ];

    return timeline;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6 bg-gray-200" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg bg-gray-200" />
              <Skeleton className="h-96 w-full rounded-lg bg-gray-200" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-lg bg-gray-200" />
              <Skeleton className="h-48 w-full rounded-lg bg-gray-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const timeline = getOrderTimeline();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/my-orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e63946] mb-6 transition-colors"
        >
          <IconChevronLeft size={20} />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Order Details
              </h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
              {order.invoiceNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  Invoice: {order.invoiceNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* TODO: Enable real-time connection status UI in future */}
              {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                {isConnected ? (
                  <>
                    <IconWifi className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <IconWifiOff className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Offline</span>
                  </>
                )}
              </div> */}
              {/* Rating Button for Delivered Orders */}
              {order.orderStatus === "delivered" && order.deliveryPartnerId && (
                <>
                  {order.partnerRating ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <IconStar size={18} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700">
                        {order.partnerRating.toFixed(1)} Rated
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRateOrder}
                      className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      <IconStar size={18} />
                      Rate Delivery
                    </Button>
                  )}
                </>
              )}
              
              {/* Order Status Badge */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                  order.orderStatus
                )}`}
              >
                {getStatusIcon(order.orderStatus)}
                <span className="capitalize">{order.orderStatus}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <div key="order-date">
              <p className="text-sm text-gray-500 mb-1">Order Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div key="payment-method">
              <p className="text-sm text-gray-500 mb-1">Payment Method</p>
              <p className="font-medium text-gray-900 uppercase">
                {order.paymentMethod}
              </p>
            </div>
            <div key="payment-status">
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <p
                className={`font-medium capitalize ${
                  order.paymentStatus === "completed"
                    ? "text-green-600"
                    : order.paymentStatus === "pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {order.paymentStatus}
              </p>
            </div>
            <div key="order-type">
              <p className="text-sm text-gray-500 mb-1">Order Type</p>
              <div className="flex items-center gap-2">
                {order.orderType === 'PRE_ORDER' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    PRE-ORDER
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                    LIVE ORDER
                  </span>
                )}
              </div>
            </div>
            <div key="delivery-slot">
              <p className="text-sm text-gray-500 mb-1">Delivery Slot</p>
              <p className="font-semibold text-gray-900">
                {order.scheduledSlot === 'LIVE' ? (
                  <span className="text-green-600 italic underline">Immediate</span>
                ) : (
                  order.scheduledSlot || 'Standard Delivery'
                )}
              </p>
              {order.scheduledDate && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Scheduled for: {order.scheduledDate}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            {timeline.length > 0 && (
              <div
                key="order-timeline"
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Timeline
                </h2>
                <div className="space-y-4">
                  {timeline.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={`${item.status}-${index}`}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.completed
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          {index < timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-12 my-1 ${
                                item.completed ? "bg-green-200" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p
                            className={`font-medium ${
                              item.completed ? "text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {item.status}
                          </p>
                          {item.date ? (
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(item.date)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mt-1">
                              {item.completed ? "In progress" : "Pending"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div
              key="order-items"
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={100}
                        height={100}
                        className="rounded-lg object-contain bg-gray-50"
                        unoptimized
                      />
                    ) : (
                      <div className="w-[100px] h-[100px] rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{item.brand}</p>
                      <h4 className="font-medium text-gray-900">
                        {item.productName}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.displayName || item.variantName}
                        {item.variantUom && item.variantUomValue && (
                          <span className="text-muted-foreground ml-1">
                            ({item.variantUomValue}{item.variantUom})
                          </span>
                        )}
                      </p>
                      {item.selectedCuttingStyle && (
                        <p className="text-sm text-gray-500 mt-1">
                          Cutting Style: {item.selectedCuttingStyle}
                        </p>
                      )}
                      {item.isComboProduct && item.comboItems && item.comboItems.length > 0 && (
                        <div className="mt-2 space-y-1 pl-3 border-l-2 border-[#e63946]/20">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Includes:</p>
                          {item.comboItems.map((ci: { quantity: number; productName?: string; variantName?: string }, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-1 h-1 rounded-full bg-[#e63946]/40" />
                              <span>{ci.quantity}x {ci.productName || ci.variantName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-sm text-gray-700">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-700">
                          Unit Price: {currencySymbol}
                          {(item.unitPrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {currencySymbol}
                        {(item.total || (item.unitPrice * item.quantity) || 0).toFixed(2)}
                      </p>
                      {item.mrp > item.unitPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          {currencySymbol}
                          {((item.mrp || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Delivery Partner Info - hide for delivered/cancelled */}
            {order.deliveryPartner && order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
              <div
                key="delivery-partner"
                className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-center gap-2 mb-4">
                  <IconTruck size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delivery Partner
                  </h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Partner Name</p>
                    <p className="font-medium text-gray-900">
                      {order.deliveryPartner.name}
                    </p>
                  </div>
                  {order.deliveryPartner.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contact</p>
                      <a
                        href={`tel:${order.deliveryPartner.phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <IconPhone size={16} />
                        <span>{order.deliveryPartner.phone}</span>
                      </a>
                    </div>
                  )}
                  {order.deliveryAssignAt && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Assigned on</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {formatDate(order.deliveryAssignAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div
              key="delivery-address"
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <IconMapPin size={20} className="text-[#e63946]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Delivery Address
                </h2>
              </div>
              <div className="space-y-2">
                <p key="name" className="font-medium text-gray-900">
                  {order.deliveryAddress.name}
                </p>
                <p key="address1" className="text-gray-700">
                  {order.deliveryAddress.addressLine1}
                </p>
                {order.deliveryAddress.addressLine2 && (
                  <p key="address2" className="text-gray-700">
                    {order.deliveryAddress.addressLine2}
                  </p>
                )}
                {order.deliveryAddress.landmark && (
                  <p key="landmark" className="text-sm text-gray-600">
                    Landmark: {order.deliveryAddress.landmark}
                  </p>
                )}
                <p key="city-state" className="text-gray-700">
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} -{" "}
                  {order.deliveryAddress.pincode}
                </p>
                <p key="country" className="text-gray-700">
                  {order.deliveryAddress.country}
                </p>
                <div
                  key="contact"
                  className="pt-3 border-t border-gray-200 mt-3"
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <IconPhone size={16} />
                    <span>{order.deliveryAddress.phone}</span>
                  </div>
                  {order.deliveryAddress.alternatePhone && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                      <IconPhone size={14} />
                      <span>{order.deliveryAddress.alternatePhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GST Information (if available) */}
            {/* {order.gstType && (order.adminState || order.customerState) && (
              <div
                key="gst-info"
                className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200"
              >
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  GST Information
                </h3>
                <div className="space-y-1 text-xs text-blue-800">
                  {order.adminState && (
                    <div className="flex justify-between">
                      <span>Company State:</span>
                      <span className="font-medium">{order.adminState}</span>
                    </div>
                  )}
                  {order.customerState && (
                    <div className="flex justify-between">
                      <span>Delivery State:</span>
                      <span className="font-medium">{order.customerState}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Type:</span>
                    <span className="font-medium uppercase">
                      {order.gstType === 'cgst_sgst' ? 'CGST + SGST' : 'IGST'}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-2 italic">
                    {order.gstType === 'cgst_sgst' 
                      ? 'Same state transaction - CGST & SGST applicable'
                      : 'Inter-state transaction - IGST applicable'
                    }
                  </div>
                </div>
              </div>
            )} */}

            {/* Order Summary */}
            <div
              key="order-summary"
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div
                  key="subtotal"
                  className="flex justify-between text-gray-700"
                >
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {(order.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div
                    key="discount"
                    className="flex justify-between text-green-600"
                  >
                    <span>Discount</span>
                    <span>
                      -{currencySymbol}
                      {(order.discount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {order.couponDiscount > 0 && (
                  <div
                    key="coupon-discount"
                    className="flex justify-between text-green-600"
                  >
                    <span>
                      Coupon Discount{" "}
                      {order.couponCode && `(${order.couponCode})`}
                    </span>
                    <span>
                      -{currencySymbol}
                      {(order.couponDiscount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div
                  key="shipping"
                  className="flex justify-between text-gray-700"
                >
                  <span>Shipping Charge</span>
                  <span>
                    {(order.shippingCharge || 0) === 0
                      ? "FREE"
                      : `${currencySymbol}${(order.shippingCharge || 0).toFixed(2)}`}
                  </span>
                </div>
                
                {/* GST Breakdown */}
                {/* {order.gstType === 'cgst_sgst' ? (
                  <>
                    {(order.cgstAmount || 0) > 0 && (
                      <div key="cgst" className="flex justify-between text-gray-700">
                        <span>CGST</span>
                        <span>
                          {currencySymbol}
                          {(order.cgstAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {(order.sgstAmount || 0) > 0 && (
                      <div key="sgst" className="flex justify-between text-gray-700">
                        <span>SGST</span>
                        <span>
                          {currencySymbol}
                          {(order.sgstAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {(order.igstAmount || 0) > 0 && (
                      <div key="igst" className="flex justify-between text-gray-700">
                        <span>IGST</span>
                        <span>
                          {currencySymbol}
                          {(order.igstAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )} */}
                
                {/* Fallback for orders without GST breakdown */}
                {!order.gstType && (order.tax || 0) > 0 && (
                  <div key="tax" className="flex justify-between text-gray-700">
                    <span>Tax ({(order.taxRate || 0).toFixed(2)}%)</span>
                    <span>
                      {currencySymbol}
                      {(order.tax || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                
                {/* Total GST Amount (if available) */}
                {(order.totalGstAmount || 0) > 0 && order.gstType && (
                  <div key="total-gst" className="flex justify-between text-gray-600 text-sm border-t border-gray-100 pt-2">
                    <span>Total GST</span>
                    <span>
                      {currencySymbol}
                      {(order.totalGstAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div key="total" className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-[#e63946]">
                      {currencySymbol}
                      {(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {order && (
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          partnerName={order.deliveryPartner?.name}
          onRatingSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
}
