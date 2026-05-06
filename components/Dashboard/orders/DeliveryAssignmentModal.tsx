"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Truck, MapPin, Star, Package, CheckCircle, XCircle, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  getAvailablePartnersForAssignment,
  assignPartnerToOrder,
  AvailablePartner,
} from "@/services/deliveryPartnerService";

interface DeliveryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  currentPartnerId?: string;
  currentPartnerName?: string;
  orderStatus: string;
  orderType?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  onAssignSuccess: () => void;
}

export default function DeliveryAssignmentModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  currentPartnerId,
  currentPartnerName,
  orderStatus,
  orderType,
  scheduledDate,
  scheduledSlot,
  onAssignSuccess,
}: DeliveryAssignmentModalProps) {
  const [partners, setPartners] = useState<AvailablePartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(currentPartnerId || "");
  const [notes, setNotes] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPartners, setIsFetchingPartners] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailablePartners();
      if (currentPartnerId) {
        setSelectedPartnerId(currentPartnerId);
      }
    }
  }, [isOpen, currentPartnerId]);

  const fetchAvailablePartners = async () => {
    try {
      setIsFetchingPartners(true);
      const response = await getAvailablePartnersForAssignment();
      if (response.success) {
        setPartners(response.data);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to fetch available partners");
    } finally {
      setIsFetchingPartners(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPartnerId) {
      toast.error("Please select a delivery partner");
      return;
    }

    try {
      setIsLoading(true);
      const response = await assignPartnerToOrder(orderId, {
        deliveryPartnerId: selectedPartnerId,
        notes: notes || undefined,
        estimatedDeliveryTime: estimatedTime || undefined,
      });

      if (response.success) {
        toast.success(`Delivery partner assigned to order ${orderNumber}`);
        onAssignSuccess();
        onClose();
        // Reset form
        setSelectedPartnerId("");
        setNotes("");
        setEstimatedTime("");
      }
    } catch (error: any) {
      console.error("Error assigning partner:", error);
      toast.error(error.response?.data?.message || "Failed to assign delivery partner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setIsLoading(true);
      // Send empty string to unassign
      const response = await assignPartnerToOrder(orderId, {
        deliveryPartnerId: "",
        notes: "",
        estimatedDeliveryTime: "",
      });

      if (response.success) {
        toast.success(`Delivery partner removed from order ${orderNumber}`);
        onAssignSuccess();
        onClose();
        // Reset form
        setSelectedPartnerId("");
        setNotes("");
        setEstimatedTime("");
      }
    } catch (error: any) {
      console.error("Error unassigning partner:", error);
      toast.error(error.response?.data?.message || "Failed to remove delivery partner");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if this is a pre-order and validate scheduling
  const isPreOrder = orderType === 'PRE_ORDER';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // For pre-orders, check if scheduled date is today or in the past
  const canAssignPreOrder = !isPreOrder || (scheduledDate && new Date(scheduledDate) <= today);
  
  // Only allow assignment when order is confirmed or later (not pending) and pre-order validation passes
  const canAssignPartner = orderStatus && 
    !["pending", "delivered", "cancelled"].includes(orderStatus.toLowerCase()) && 
    canAssignPreOrder;
    
  const isOrderEditable = orderStatus && !["delivered", "cancelled"].includes(orderStatus.toLowerCase());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assign Delivery Partner
          </DialogTitle>
          <DialogDescription>
            Order: <span className="font-semibold text-foreground">{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pre-Order Validation Warning */}
          {isPreOrder && (
            <div className={`border rounded-lg p-3 ${canAssignPreOrder ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Pre-Order</span>
              </div>
              <p className="text-sm text-blue-700">
                Scheduled for: {scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-IN') : 'Not set'}
                {scheduledSlot && ` (${scheduledSlot})`}
              </p>
              {!canAssignPreOrder && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ Cannot assign partner until scheduled date ({scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-IN') : 'Not set'})
                </p>
              )}
            </div>
          )}

          {/* Order Status Warning - Show if order is pending */}
          {orderStatus?.toLowerCase() === "pending" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Partner can only be assigned after order is confirmed
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Please confirm the order first before assigning a delivery partner.
              </p>
            </div>
          )}

          {/* Current Assignment Status */}
          {currentPartnerId && currentPartnerName ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {currentPartnerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">{currentPartnerName}</p>
                    <p className="text-xs text-green-600">Partner ID: {currentPartnerId}</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              
              {canAssignPartner && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-green-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleUnassign} 
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove Partner
                  </Button>
                  {/* <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedPartnerId("")}
                    disabled={isLoading}
                  >
                    Change Partner
                  </Button> */}
                </div>
              )}
            </div>
          ) : canAssignPartner ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800">No delivery partner assigned yet</p>
            </div>
          ) : null}

          {/* Partner Selection */}
          {canAssignPartner && (!currentPartnerId || selectedPartnerId === "") && (
            <>
              <div className="space-y-2">
                <Label>Select Delivery Partner</Label>
                {isFetchingPartners ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading partners...
                  </div>
                ) : partners.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available partners found</p>
                ) : (
                  <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a delivery partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          <div className="flex items-center gap-2 py-1">
                            <div className="flex-1">
                              <p className="font-medium">{partner.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {partner.vehicleType} • {partner.vehicleNumber} • {partner.totalDeliveries} deliveries
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{partner.averageRating.toFixed(1)}</span>
                              </div>
                              {partner.isOnline && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                                  Online
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Estimated Delivery Time */}
              {/* <div className="space-y-2">
                <Label>Estimated Delivery Time (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div> */}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Delivery Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any special instructions for the delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Order Status Warning - Delivered/Cancelled */}
          {!canAssignPartner && orderStatus?.toLowerCase() !== "pending" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                This order is {orderStatus?.toLowerCase()} and cannot be modified.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canAssignPartner && (!currentPartnerId || selectedPartnerId === "") && (
            <Button onClick={handleAssign} disabled={isLoading || !selectedPartnerId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentPartnerId ? "Update Assignment" : "Assign Partner"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
