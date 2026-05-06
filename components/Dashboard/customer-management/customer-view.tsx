"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import CustomerSidebar from "./customer-sidebar";
import CustomerDetail from "./customer-detail";
import { customerService, type Customer } from "@/services/customerService";
import { toast } from "sonner";

interface CustomerViewProps {
  customerId: string;
}

export default function CustomerView({ customerId }: CustomerViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Get Customer ID from URL path on initial load
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    const pathSegments = normalizedPath.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if the last segment is a valid Customer ID (not "view")
    if (lastSegment && lastSegment !== "view") {
      setSelectedCustomerId(lastSegment);
    }
  }, [pathname]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pathSegments = path.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment && lastSegment !== "view") {
        setSelectedCustomerId(lastSegment);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch customer when selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomer(selectedCustomerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const fetchCustomer = async (id: string) => {
    try {
      setLoading(true);
      const data = await customerService.getById(id);
      if (!data) {
        toast.error("Customer not found");
        router.push("/dashboard/customer-management");
        return;
      }
      setCustomer(data);
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Failed to load customer details");
      router.push("/dashboard/customer-management");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    // Update URL without page refresh using History API
    window.history.pushState(
      null,
      "",
      `/dashboard/customer-management/view/${id}`
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Does NOT refresh when clicking customers */}
        <CustomerSidebar
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleSelectCustomer}
        />

        {/* Details - Only this section updates */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-muted-foreground">Loading customer...</span>
            </div>
          </div>
        ) : customer ? (
          <CustomerDetail customer={customer} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="size-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="size-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground">Select a customer to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
