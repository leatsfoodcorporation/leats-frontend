"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  itemsOrdered: string;
  total: number;
  payment: string;
  status: string;
  deliveryType: string;
  orderType?: string;
  scheduledSlot?: string;
}


interface OnlineOrdersTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function OnlineOrdersTable({ 
  orders, 
  onStatusChange,
  onDeleteOrder 
}: OnlineOrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const handleStatusChange = (orderId: string, orderNumber: string, newStatus: string) => {
    onStatusChange(orderId, newStatus);
    toast.success(`Order ${orderNumber} status changed to ${newStatus}`);
  };

  const handleDelete = (orderId: string, orderNumber: string) => {
    if (confirm(`Are you sure you want to delete order ${orderNumber}?`)) {
      onDeleteOrder(orderId);
      toast.error(`Order ${orderNumber} deleted`);
    }
  };

  const handleViewDetails = (orderNumber: string) => {
    toast.info(`View details for ${orderNumber} - Coming soon`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "packed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "shipped":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Get available status options based on current status (forward flow only)
  const getAvailableStatuses = (currentStatus: string): string[] => {
    const statusFlow = {
      "Pending": ["Packed", "Cancelled"],
      "Packed": ["Shipped", "Cancelled"],
      "Shipped": ["Delivered", "Cancelled"],
      "Delivered": ["Delivered"], // Can't change from Delivered
      "Cancelled": ["Cancelled"], // Can't change from Cancelled
    };

    return statusFlow[currentStatus as keyof typeof statusFlow] || ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];
  };

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No orders found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Order Number</TableHead>
              <TableHead className="font-semibold">Order Date</TableHead>
              <TableHead className="font-semibold">Customer Name</TableHead>
              <TableHead className="font-semibold">Items Ordered</TableHead>
              <TableHead className="font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Order Type</TableHead>
              <TableHead className="font-semibold">Delivery Slot</TableHead>
              <TableHead className="font-semibold">Delivery Type</TableHead>

              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.orderDate}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {order.itemsOrdered}
                </TableCell>
                <TableCell className="font-semibold">
                  Rs. {order.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {order.payment}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`${getStatusBadgeColor(order.status)} px-3 py-1 h-auto font-medium`}
                        disabled={order.status === "Delivered" || order.status === "Cancelled"}
                      >
                        {order.status}
                        {order.status !== "Delivered" && order.status !== "Cancelled" && (
                          <ChevronDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {getAvailableStatuses(order.status).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(order.id, order.orderNumber, status)}
                          className={order.status === status ? "bg-gray-100" : ""}
                          disabled={order.status === status}
                        >
                          <Badge className={`${getStatusBadgeColor(status)} mr-2`}>
                            {status}
                          </Badge>
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>

                  {order.orderType ? (
                    <Badge 
                      variant="outline" 
                      className={order.orderType === "LIVE" 
                        ? "bg-orange-50 text-orange-700 border-orange-200" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {order.orderType === "LIVE" ? "Live Order" : "Pre-Order"}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {order.scheduledSlot ? (
                    <div className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                      {order.scheduledSlot}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Immediate</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {order.deliveryType}
                  </Badge>
                </TableCell>
                <TableCell>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleViewDetails(order.orderNumber)}
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(order.id, order.orderNumber)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} entries
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* First page */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(1);
                    }}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis before current */}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Previous page */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(currentPage - 1);
                    }}
                    className="cursor-pointer"
                  >
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Current page */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  onClick={(e) => e.preventDefault()}
                  className="cursor-default"
                >
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {/* Next page */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(currentPage + 1);
                    }}
                    className="cursor-pointer"
                  >
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis after current */}
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(totalPages);
                    }}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
