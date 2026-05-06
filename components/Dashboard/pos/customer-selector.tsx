"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "./pos-interface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { customerService } from "@/services/offline-services/customerService";
import { toast } from "sonner";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch customers when dialog opens or search query changes
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim()) {
        const response = await customerService.searchCustomers(searchQuery);
        setCustomers(response.data);
      } else {
        const response = await customerService.getAllCustomers({ limit: 50 });
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers;

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Name and phone number are required");
      return;
    }

    try {
      setCreating(true);
      const response = await customerService.createCustomer({
        name: newCustomer.name,
        phoneNumber: newCustomer.phone,
      });

      if (response.success) {
        const customer: Customer = {
          id: response.data.id,
          name: response.data.name,
          phone: response.data.phoneNumber || response.data.phone,
          email: response.data.email,
        };
        
        onSelectCustomer(customer);
        
        if (response.isExisting) {
          toast.info("Customer already exists", {
            description: `${customer.name} was found in the system`,
          });
        } else {
          toast.success("Customer added successfully", {
            description: `${customer.name} has been added`,
          });
        }
        
        setNewCustomer({ name: "", phone: "" });
        setShowAddForm(false);
        setOpen(false);
      }
    } catch (error: unknown) {
      console.error("Error creating customer:", error);
      toast.error("Failed to add customer", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {selectedCustomer ? selectedCustomer.name : "Select Customer"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showAddForm ? "Add New Customer" : "Select Customer"}
          </DialogTitle>
        </DialogHeader>

        {!showAddForm ? (
          <div className="space-y-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  Loading customers...
                </span>
              </div>
            )}

            {/* Customer List */}
            {!loading && (
            <div className="max-h-96 overflow-auto space-y-2">
              {/* Walk-in Customer Option */}
              <button
                onClick={() => {
                  onSelectCustomer(null);
                  setOpen(false);
                }}
                className="w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  Walk-in Customer
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No customer information
                </p>
              </button>

              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      {customer.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.email}
                        </p>
                      )}
                      {(customer.phone || customer.phoneNumber) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.phone || customer.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredCustomers.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No customers found
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try a different search or add a new customer
                  </p>
                </div>
              )}
            </div>
            )}

            {/* Add New Customer Button */}
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                placeholder="Enter customer name"
                disabled={creating}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <PhoneInput
                id="phone"
                value={newCustomer.phone}
                onChange={(value) =>
                  setNewCustomer({ ...newCustomer, phone: value })
                }
                disabled={creating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name || !newCustomer.phone || creating}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  "Add Customer"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
