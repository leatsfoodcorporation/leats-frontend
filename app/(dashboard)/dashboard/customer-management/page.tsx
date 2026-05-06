"use client";

import { useRouter } from "next/navigation";
import CustomerSidebar from "@/components/Dashboard/customer-management/customer-sidebar";

export default function CustomerManagementPage() {
  const router = useRouter();

  const handleSelectCustomer = (customerId: string) => {
    router.push(`/dashboard/customer-management/view/${customerId}`);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CustomerSidebar
          selectedCustomerId=""
          onSelectCustomer={handleSelectCustomer}
        />

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center bg-muted/30">
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
      </div>
    </div>
  );
}
