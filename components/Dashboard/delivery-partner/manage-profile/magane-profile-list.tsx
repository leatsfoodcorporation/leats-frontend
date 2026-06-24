"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  Eye,
  Power,
  PowerOff,
  Ban,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  getApprovedPartners,
  updatePartnerStatus,
  type DeliveryPartner,
} from "@/services/deliveryPartnerService";

export default function ManageProfileList() {
  const { canEdit } = usePermissions();
  const router = useRouter();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionNote, setSuspensionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    suspended: 0,
    totalDeliveries: 0,
  });

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: 1,
        limit: 100,
      };

      if (statusFilter !== "all") {
        params.partnerStatus = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await getApprovedPartners(params);
      setPartners(response.data);
      setCurrentPage(1); // Reset to first page on filter change
    } catch (error: unknown) {
      console.error("Error fetching partners:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to fetch partners", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const [activeRes, inactiveRes, suspendedRes] = await Promise.all([
        getApprovedPartners({ partnerStatus: "active", limit: 1 }),
        getApprovedPartners({ partnerStatus: "inactive", limit: 1 }),
        getApprovedPartners({ partnerStatus: "suspended", limit: 1 }),
      ]);

      // Calculate total deliveries
      const allPartnersRes = await getApprovedPartners({ limit: 1000 });
      const totalDeliveries = allPartnersRes.data.reduce(
        (sum, partner) => sum + partner.totalDeliveries,
        0
      );

      setStats({
        active: activeRes.pagination.totalCount,
        inactive: inactiveRes.pagination.totalCount,
        suspended: suspendedRes.pagination.totalCount,
        totalDeliveries,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
    fetchStats();
  }, [fetchPartners, fetchStats]);

  const handleStatusChange = async (partner: DeliveryPartner, newStatus: "active" | "inactive") => {
    try {
      await updatePartnerStatus(partner.id, {
        status: newStatus,
      });

      toast.success(`Partner marked as ${newStatus}`);
      await fetchPartners();
      await fetchStats();
    } catch (error: unknown) {
      console.error("Error updating status:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to update status", {
        description: err.response?.data?.message || err.message,
      });
    }
  };

  const handleSuspend = (partner: DeliveryPartner) => {
    setSelectedPartner(partner);
    setSuspendModalOpen(true);
  };

  const confirmSuspend = async () => {
    if (!selectedPartner) return;

    if (!suspensionReason || !suspensionNote) {
      toast.error("Please provide reason and note");
      return;
    }

    if (suspensionNote.length < 20) {
      toast.error("Suspension note must be at least 20 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      
      await updatePartnerStatus(selectedPartner.id, {
        status: "suspended",
        suspensionReason,
        suspensionNote,
      });

      toast.success("Partner suspended successfully", {
        description: "Suspension email has been sent to the partner",
      });
      
      // Close modal and reset form
      setSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspensionNote("");
      setSelectedPartner(null);
      
      // Refresh data
      await fetchPartners();
      await fetchStats();
    } catch (error: unknown) {
      console.error("Error suspending partner:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to suspend partner", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPartnerStatusBadge = (partnerStatus?: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      active: {
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        label: "Active",
      },
      inactive: {
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        label: "Inactive",
      },
      suspended: {
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        label: "Suspended",
      },
    };

    const config = variants[partnerStatus || "active"];

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const statsCards = [
    {
      label: "Active Partners",
      value: stats.active,
      icon: CheckCircle,
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      label: "Inactive Partners",
      value: stats.inactive,
      icon: XCircle,
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      label: "Suspended",
      value: stats.suspended,
      icon: AlertTriangle,
      bgColor: "bg-red-50 dark:bg-red-950/20",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
    },
    {
      label: "Total Deliveries",
      value: stats.totalDeliveries.toLocaleString(),
      icon: Package,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
  ];

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
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Manage Delivery Partners</h1>
        <p className="text-sm text-muted-foreground">
          View and manage partner profiles, activity, and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card
            key={stat.label}
            className={`${stat.bgColor} ${stat.borderColor} border-2`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.iconColor}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPartners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  No delivery partners found
                </TableCell>
              </TableRow>
            ) : (
              currentPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-mono font-semibold">
                    {partner.partnerId}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {partner.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{partner.phone}</div>
                      <div className="text-muted-foreground text-xs">
                        {partner.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="capitalize">{partner.vehicleType}</div>
                      <div className="text-muted-foreground text-xs">
                        {partner.vehicleNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{partner.rating.toFixed(1)}</span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{partner.totalDeliveries}</div>
                    <div className="text-xs text-muted-foreground">
                      {partner.totalDeliveries > 0 ? "98% completion" : "No deliveries"}
                    </div>
                  </TableCell>
                  <TableCell>{getPartnerStatusBadge(partner.partnerStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/delivery-partner/profile/${partner.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </DropdownMenuItem>

                        {canEdit("partner_management") && partner.partnerStatus === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(partner, "inactive")}
                          >
                            <PowerOff className="h-4 w-4 mr-2" />
                            Mark Inactive
                          </DropdownMenuItem>
                        )}

                        {canEdit("partner_management") && partner.partnerStatus === "inactive" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(partner, "active")}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Mark Active
                          </DropdownMenuItem>
                        )}

                        {canEdit("partner_management") && partner.partnerStatus !== "suspended" && (
                          <DropdownMenuItem
                            onClick={() => handleSuspend(partner)}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend Partner
                          </DropdownMenuItem>
                        )}

                        {canEdit("partner_management") && partner.partnerStatus === "suspended" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(partner, "active")}
                            className="text-green-600"
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Reactivate Partner
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

      {/* Suspend Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Delivery Partner</DialogTitle>
            <DialogDescription>
              Suspend <strong>{selectedPartner?.name}</strong> ({selectedPartner?.partnerId})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason *</Label>
              <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Policy Violation">Policy Violation</SelectItem>
                  <SelectItem value="Poor Performance">Poor Performance</SelectItem>
                  <SelectItem value="Customer Complaints">Customer Complaints</SelectItem>
                  <SelectItem value="Document Issues">Document Issues</SelectItem>
                  <SelectItem value="Safety Concerns">Safety Concerns</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Detailed Note * (min 20 characters)</Label>
              <Textarea
                id="note"
                value={suspensionNote}
                onChange={(e) => setSuspensionNote(e.target.value)}
                placeholder="Provide detailed explanation for suspension..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {suspensionNote.length}/20 characters
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Partner will be notified via email and will not be able to accept deliveries.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendModalOpen(false);
                setSuspensionReason("");
                setSuspensionNote("");
                setSelectedPartner(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
              disabled={!suspensionReason || suspensionNote.length < 20 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Suspend Partner"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
