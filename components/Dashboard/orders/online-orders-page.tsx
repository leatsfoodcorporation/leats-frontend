"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Download, Filter, X } from "lucide-react";
import { OnlineOrdersTable } from "./online-orders-table";
import { toast } from "sonner";

// Mock data for demonstration
const initialMockOrders = [
  {
    id: "1",
    orderNumber: "ORD-20251208-000893",
    orderDate: "12/8/2025",
    customerName: "Madhumitha HM",
    itemsOrdered: "office and college w... & 4 more",
    total: 1860.0,
    payment: "paid",
    status: "Pending",
    deliveryType: "Manual",
    orderType: "LIVE",
    scheduledSlot: "LIVE",
  },
  {
    id: "2",
    orderNumber: "ORD-20251207-000892",
    orderDate: "12/7/2025",
    customerName: "Rajesh Kumar",
    itemsOrdered: "laptop accessories & 2 more",
    total: 3450.0,
    payment: "paid",
    status: "Pending",
    deliveryType: "Manual",
    orderType: "PRE_ORDER",
    scheduledSlot: "03:00 PM - 06:00 PM",
  }
];

export function OnlineOrdersPage() {
  const [orders, setOrders] = useState(initialMockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Pending", "Packed", "Shipped"]);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const handleToggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleClearStatusFilters = () => {
    setSelectedStatuses([]);
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(order.status);

      const matchesPayment =
        paymentFilter === "all" ||
        order.payment.toLowerCase() === paymentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPayment;
    });
  };

  const filteredOrders = getFilteredOrders();

  const getStatusCount = (status: string) => {
    return orders.filter((order) => order.status === status).length;
  };

  const statusOptions = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];

  return (
    <div className="space-y-6 p-6">
      
      {/* Status Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {getStatusCount("Pending")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Packed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {getStatusCount("Packed")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Shipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {getStatusCount("Shipped")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {getStatusCount("Delivered")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {getStatusCount("Cancelled")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[220px] justify-start">
                <Filter className="mr-2 h-4 w-4" />
                {selectedStatuses.length === 0
                  ? "Filter by status"
                  : `${selectedStatuses.length} status selected`}
                {selectedStatuses.length > 0 && (
                  <X
                    className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearStatusFilters();
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-3" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Select Status</p>
                  {selectedStatuses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearStatusFilters}
                      className="h-auto p-0 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                {statusOptions.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => handleToggleStatus(status)}
                    />
                    <label
                      htmlFor={status}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <OnlineOrdersTable
          orders={filteredOrders}
          onStatusChange={handleStatusChange}
          onDeleteOrder={handleDeleteOrder}
        />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>
    </div>
  );
}
