"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getDeliveryPartners,
  type DeliveryPartner,
} from "@/services/deliveryPartnerService";

interface DeliveryPartnerListProps {
  status: string;
  searchQuery?: string;
  onDataChange?: () => void;
}

export default function DeliveryPartnerList({
  status,
  searchQuery = "",
  onDataChange,
}: DeliveryPartnerListProps) {
  const router = useRouter();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: 1,
        limit: 100,
      };

      if (status !== "all") {
        params.status = status;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await getDeliveryPartners(params);
      setPartners(response.data);
      setCurrentPage(1); // Reset to first page on filter change
    } catch (error: unknown) {
      console.error("Error fetching partners:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to fetch delivery partners", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [status, searchQuery]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const getStatusBadge = (status: string, partner: DeliveryPartner) => {
    const variants: Record<
      string,
      { className: string; label: string }
    > = {
      pending: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Pending" },
      verified: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Verified" },
      approved: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Approved" },
      rejected: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rejected" },
    };

    const config = variants[status] || variants.pending;

    // If status is final (approved or rejected), show non-clickable badge
    if (status === "approved" || status === "rejected") {
      return (
        <Badge className={config.className}>
          {config.label}
        </Badge>
      );
    }

    // Otherwise, show dropdown with next status options
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${config.className} h-6 px-2 hover:opacity-80`}
          >
            {config.label}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {status === "pending" && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(partner, "verified")}
              className="text-blue-600"
            >
              Mark as Verified
            </DropdownMenuItem>
          )}
          {status === "verified" && (
            <>
              <DropdownMenuItem
                onClick={() => handleStatusChange(partner, "approved")}
                className="text-green-600"
              >
                Approve Partner
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(partner, "rejected")}
                className="text-destructive"
              >
                Reject Partner
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleStatusChange = async (partner: DeliveryPartner, newStatus: "pending" | "verified" | "approved" | "rejected") => {
    // If rejecting, open modal instead
    if (newStatus === "rejected") {
      setSelectedPartner(partner);
      setRejectModalOpen(true);
      return;
    }

    try {
      const { updateApplicationStatus } = await import("@/services/deliveryPartnerService");
      
      await updateApplicationStatus(partner.id, {
        status: newStatus as "verified" | "approved" | "rejected",
      });
      
      toast.success(`Partner status updated to ${newStatus}`);
      await fetchPartners();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Error updating status:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to update status", {
        description: err.response?.data?.message || err.message,
      });
    }
  };

  const confirmReject = async () => {
    if (!selectedPartner) return;

    if (!rejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { updateApplicationStatus } = await import("@/services/deliveryPartnerService");
      
      await updateApplicationStatus(selectedPartner.id, {
        status: "rejected",
        reason: rejectionReason,
        note: rejectionNote,
      });
      
      toast.success("Partner application rejected", {
        description: "Rejection email has been sent to the partner",
      });
      
      // Close modal and reset form
      setRejectModalOpen(false);
      setRejectionReason("");
      setRejectionNote("");
      setSelectedPartner(null);
      
      // Refresh data
      await fetchPartners();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Error rejecting partner:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to reject partner", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(partners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPartners = partners.slice(startIndex, endIndex);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis-end");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Grid Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPartners.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No delivery partners found
          </div>
        ) : (
          currentPartners.map((partner) => (
            <div
              key={partner.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              {/* Header with Avatar and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{partner.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      ID: {partner.partnerId || partner.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(partner.applicationStatus, partner)}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📞</span>
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📧</span>
                  <span className="truncate">{partner.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">🚗</span>
                  <span className="capitalize">{partner.vehicleType} • {partner.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📍</span>
                  <span>{partner.city || "N/A"}, {partner.state || "N/A"}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3 pt-3 border-t">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">{partner.totalDeliveries}</p>
                  <p className="text-xs text-muted-foreground">Completed Orders</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-2xl font-bold text-yellow-600">{partner.rating.toFixed(1)} ⭐</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/dashboard/delivery-partner/profile/${partner.id}`)
                  }
                >
                  View Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/dashboard/delivery-partner/edit/${partner.id}`)
                  }
                >
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, partners.length)} of{" "}
            {partners.length} partners
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis-start" || page === "ellipsis-end" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Partner Application</DialogTitle>
            <DialogDescription>
              Reject application for <strong>{selectedPartner?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invalid Documents">Invalid Documents</SelectItem>
                  <SelectItem value="Incomplete Information">Incomplete Information</SelectItem>
                  <SelectItem value="Failed Verification">Failed Verification</SelectItem>
                  <SelectItem value="License Issues">License Issues</SelectItem>
                  <SelectItem value="Vehicle Not Suitable">Vehicle Not Suitable</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Additional Note (Optional)</Label>
              <Textarea
                id="note"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Provide additional details..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ Partner will be notified via email about the rejection.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason("");
                setRejectionNote("");
                setSelectedPartner(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
