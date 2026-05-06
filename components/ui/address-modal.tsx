"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Address } from "@/types/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountryStateCitySelect } from "@/components/ui/country-state-city-select";
import { ZipCodeInput } from "@/components/ui/zipcode-input";
import { Separator } from "@/components/ui/separator";
import { checkPincodeServiceability } from "@/services/deliveryZoneService";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<Address, "id">) => void;
  editingAddress?: Address | null;
  isLoading?: boolean;
}

export function AddressModal({
  isOpen,
  onClose,
  onSave,
  editingAddress,
  isLoading = false,
}: AddressModalProps) {
  const [formData, setFormData] = useState<{
    label: string;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    zipCode: string;
    country: string;
  }>({
    label: editingAddress?.label || "Home",
    fullName: editingAddress?.fullName || "",
    phoneNumber: editingAddress?.phoneNumber || "",
    addressLine1: editingAddress?.addressLine1 || "",
    addressLine2: editingAddress?.addressLine2 || "",
    city: editingAddress?.city || "",
    district: editingAddress?.district || "",
    state: editingAddress?.state || "",
    zipCode: editingAddress?.zipCode || "",
    country: editingAddress?.country || "",
  });

  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [serviceabilityMessage, setServiceabilityMessage] = useState("");

  const validatePincode = async (pincode: string, country?: string, city?: string, state?: string) => {
    if (!pincode || pincode.length < 4) {
      setIsServiceable(null);
      setServiceabilityMessage("");
      return;
    }

    setIsValidating(true);
    try {
      const result = await checkPincodeServiceability(pincode, country, city, state);
      setIsServiceable(result.serviceable);
      setServiceabilityMessage(result.message);
    } catch (error) {
      console.error("Error validating pincode:", error);
      setIsServiceable(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = [];
    if (!formData.fullName?.trim()) missingFields.push("Full Name");
    if (!formData.phoneNumber?.trim()) missingFields.push("Phone Number");
    if (!formData.addressLine1?.trim()) missingFields.push("Address");
    if (!formData.city?.trim()) missingFields.push("City");
    if (!formData.state?.trim()) missingFields.push("State");
    if (!formData.zipCode?.trim()) missingFields.push("Pincode");

    if (missingFields.length > 0) {
      alert(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (isServiceable === false) {
      alert("Selected location is not serviceable for delivery.");
      return;
    }

    onSave(formData);
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      label: "Home",
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      zipCode: "",
      country: "India",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAddress ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {editingAddress 
              ? "Update your address information" 
              : "Add a new delivery address to your profile"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pincode & Validation - MOVED TO TOP FOR UX */}
          <div className="space-y-2 pb-2">
            <Label htmlFor="zipCode" className="flex items-center justify-between">
              <span>Pincode *</span>
              {isValidating && (
                <span className="flex items-center text-[10px] text-muted-foreground animate-pulse">
                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                  Checking availability...
                </span>
              )}
            </Label>
            <ZipCodeInput
              id="zipCode"
              country={formData.country || ""}
              state={formData.state}
              city={formData.city}
              value={formData.zipCode}
              onChange={(value) => {
                setFormData({ ...formData, zipCode: value });
                validatePincode(value, formData.country, formData.city, formData.state);
              }}
              onLocationSelect={(location) => {
                setFormData((prev) => ({
                  ...prev,
                  city: location.city !== undefined ? location.city : prev.city,
                  state: location.state !== undefined ? location.state : prev.state,
                  district: location.district !== undefined ? location.district : prev.district,
                  country: location.country !== undefined ? location.country : prev.country,
                }));
              }}
              placeholder="6-digit pincode"
            />
            {isServiceable === true && (
              <p className="text-[11px] text-green-600 flex items-center gap-1 font-medium bg-green-50 p-1.5 rounded border border-green-100 italic">
                <CheckCircle2 size={12} />
                {serviceabilityMessage}
              </p>
            )}
            {isServiceable === false && (
              <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium bg-red-50 p-1.5 rounded border border-red-100 italic">
                <AlertCircle size={12} />
                {serviceabilityMessage}
              </p>
            )}
          </div>

          <Separator className="my-4" />

          {/* Address Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Address Label *</Label>
            <Select
              value={formData.label}
              onValueChange={(value) =>
                setFormData({ ...formData, label: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select address type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <PhoneInput
                key={`phone-${formData.country}`}
                id="phoneNumber"
                country={formData.country || ""}
                value={formData.phoneNumber}
                onChange={(value) =>
                  setFormData({ ...formData, phoneNumber: value })
                }
                disabled={!isOpen}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              type="text"
              value={formData.addressLine1}
              onChange={(e) =>
                setFormData({ ...formData, addressLine1: e.target.value })
              }
              placeholder="House/Flat No, Building Name, Street"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
            <Input
              id="addressLine2"
              type="text"
              value={formData.addressLine2}
              onChange={(e) =>
                setFormData({ ...formData, addressLine2: e.target.value })
              }
              placeholder="Landmark, Area"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                type="text"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                placeholder="Enter district"
              />
            </div>
          </div>

          {/* Country, State, City */}
          <div className="space-y-4">
            <CountryStateCitySelect
              value={{
                country: formData.country,
                state: formData.state,
                city: formData.city,
              }}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  country: value.country,
                  state: value.state,
                  city: value.city,
                });
              }}
              required
              showLabels
              countryLabel="Country"
              stateLabel="State"
              cityLabel="City"
            />
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isServiceable === false || isValidating}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingAddress ? "Updating..." : "Saving..."}
                </>
              ) : (
                editingAddress ? "Update Address" : "Save Address"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}