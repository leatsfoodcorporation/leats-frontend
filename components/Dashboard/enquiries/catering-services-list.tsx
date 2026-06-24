"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Search, Loader2, Phone, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axiosInstance from "@/lib/axios";

interface CateringServiceEnquiry {
  id: string;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount: string;
  venue: string;
  menuPreferences: string;
  budget: string;
  message: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  contacted: "default",
  completed: "outline",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function CateringServicesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAdd, canEdit, canDelete } = usePermissions();
  
  const [enquiries, setEnquiries] = useState<CateringServiceEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<CateringServiceEnquiry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Get search and page from URL params
  const searchQuery = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/enquiry/catering-service");
      
      if (response.data.success) {
        setEnquiries(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching catering service enquiries:", error);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  // Update URL search params
  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when search changes
    if (key === "search") {
      params.set("page", "1");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams("search", value);
  };

  const handlePageChange = (page: number) => {
    updateSearchParams("page", page.toString());
  };

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.phone.includes(searchQuery) ||
      enquiry.eventType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEnquiries = filteredEnquiries.slice(startIndex, endIndex);

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

  const handleView = (enquiry: CateringServiceEnquiry) => {
    setSelectedEnquiry(enquiry);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await axiosInstance.patch(`/api/enquiry/catering-service/${id}`, {
        status: newStatus,
      });

      if (response.data.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
        toast.success("Status updated successfully");
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      const errorMessage = error.response?.data?.error || "Failed to update status";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setEnquiryToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!enquiryToDelete) return;

    try {
      const response = await axiosInstance.delete(`/api/enquiry/catering-service/${enquiryToDelete.id}`);

      if (response.data.success) {
        setEnquiries((prev) => prev.filter((e) => e.id !== enquiryToDelete.id));
        toast.success("Enquiry deleted successfully");
        
        // If current page becomes empty after deletion, go to previous page
        const remainingEnquiries = enquiries.filter((e) => e.id !== enquiryToDelete.id);
        const newTotalPages = Math.ceil(remainingEnquiries.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          handlePageChange(newTotalPages);
        }
      }
    } catch (error: any) {
      console.error("Error deleting enquiry:", error);
      const errorMessage = error.response?.data?.error || "Failed to delete enquiry";
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setEnquiryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or event type..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <p className="text-muted-foreground">Loading enquiries...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">No catering service enquiries found</p>
                </TableCell>
              </TableRow>
            ) : (
              currentEnquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell className="font-medium">{enquiry.name}</TableCell>
                  <TableCell>{enquiry.eventType}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="size-3" />
                        <span>{enquiry.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{enquiry.guestCount}</TableCell>
                  <TableCell>
                    {new Date(enquiry.eventDate).toLocaleDateString()}
                    {enquiry.eventTime && (
                      <div className="text-xs text-muted-foreground">
                        {enquiry.eventTime}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(enquiry.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canEdit("catering_enquiries") ? <Select
                      value={enquiry.status}
                      onValueChange={(value) => handleStatusChange(enquiry.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue>
                          <Badge variant={statusColors[enquiry.status]}>
                            {statusLabels[enquiry.status]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`size-2 rounded-full ${
                                  value === "pending"
                                    ? "bg-gray-500"
                                    : value === "contacted"
                                    ? "bg-blue-500"
                                    : value === "completed"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> : <Badge variant={statusColors[enquiry.status]}>{statusLabels[enquiry.status]}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleView(enquiry)}
                        title="View details"
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canDelete("catering_enquiries") && <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(enquiry.id, enquiry.name)}
                        title="Delete enquiry"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredEnquiries.length)} of{" "}
            {filteredEnquiries.length} enquiries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                      onClick={() => handlePageChange(page as number)}
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
                    handlePageChange(Math.min(totalPages, currentPage + 1))
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catering Service Enquiry Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedEnquiry && new Date(selectedEnquiry.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Type</p>
                  <p className="text-sm">{selectedEnquiry.eventType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedEnquiry.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                  <p className="text-sm">
                    {new Date(selectedEnquiry.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Time</p>
                  <p className="text-sm">{selectedEnquiry.eventTime || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Number of Guests</p>
                  <p className="text-sm">{selectedEnquiry.guestCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget</p>
                  <p className="text-sm">{selectedEnquiry.budget || "-"}</p>
                </div>
              </div>
              {selectedEnquiry.venue && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Venue</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedEnquiry.venue}</p>
                </div>
              )}
              {selectedEnquiry.menuPreferences && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Menu Preferences
                  </p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedEnquiry.menuPreferences}
                  </p>
                </div>
              )}
              {selectedEnquiry.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Additional Requirements
                  </p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedEnquiry.message}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={statusColors[selectedEnquiry.status]} className="mt-1">
                  {statusLabels[selectedEnquiry.status]}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the enquiry from{" "}
              <span className="font-semibold">{enquiryToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
