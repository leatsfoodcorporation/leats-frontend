"use client";

import { MapPin, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Address } from "@/types/auth";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (address: Address) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: Address) => void;
  isLoading?: boolean;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onEditAddress,
  isLoading = false,
}: AddressSelectorProps) {

  const formatAddress = (address: Address) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.district,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No delivery address found
        </h3>
        <p className="text-muted-foreground mb-4">
          Add your delivery address to continue with checkout
        </p>
        <Button onClick={onAddNewAddress} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Delivery Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Select Delivery Address
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNewAddress}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {/* Address Cards */}
      <div className="grid grid-cols-1 gap-4">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedAddressId === address.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelectAddress(address)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">
                      {address.label}
                    </h4>
                    {selectedAddressId === address.id && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {address.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.phoneNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(address)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAddress(address);
                    }}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}