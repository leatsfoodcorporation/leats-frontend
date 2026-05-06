"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { PhoneInput } from "@/components/ui/phone-input";
import { ZipCodeInput } from "@/components/ui/zipcode-input";
import { CountryStateCitySelect } from "@/components/ui/country-state-city-select";
import type { CreateDeliveryPartnerData, DeliveryPartner, UpdateDeliveryPartnerData } from "@/services/deliveryPartnerService";

interface CreatePartnerProps {
  mode?: "create" | "edit";
  partnerId?: string;
  initialData?: DeliveryPartner;
}

export default function CreatePartner({
  mode = "create",
  partnerId,
  initialData,
}: CreatePartnerProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    dateOfBirth: undefined as Date | undefined,
    gender: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    email: "",
    profilePhoto: null as File | null,

    // Address Details
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India", // Default country
    pincode: "",

    // ID Proof & Verification
    aadharNumber: "",
    drivingLicenseNumber: "",
    vehicleRC: null as File | null,
    idProofDocuments: null as File | null,

    // Vehicle Details
    vehicleType: "",
    vehicleModel: "",
    vehicleNumber: "",
    insuranceValidityDate: undefined as Date | undefined,
    pollutionCertificateValidity: undefined as Date | undefined,

    // Emergency Contact
    emergencyContactName: "",
    emergencyRelationship: "",
    emergencyContactNumber: "",

    // Admin fields
    password: "",
    status: "pending",
  });

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("🔍 Loading partner data for edit:", initialData);
      
      // Parse address - handle both comma-separated and single string
      let addressLine1 = "";
      let addressLine2 = "";
      
      if (initialData.address) {
        const addressParts = initialData.address.split(",").map(s => s.trim());
        addressLine1 = addressParts[0] || "";
        addressLine2 = addressParts.length > 1 ? addressParts.slice(1).join(", ") : "";
      }
      
      // Format phone number - ensure it has proper format
      let formattedPhone = initialData.phone || "";
      if (formattedPhone) {
        // Remove all spaces first
        formattedPhone = formattedPhone.replace(/\s/g, "");
        // If it doesn't start with +, add +91
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = `+91${formattedPhone}`;
        }
        // Add space after country code (+91 or +1, etc.)
        formattedPhone = formattedPhone.replace(/^(\+\d{1,3})(\d)/, "$1 $2");
      }
      
      // Format alternate phone number
      let formattedAltPhone = initialData.alternateMobileNumber || "";
      if (formattedAltPhone) {
        formattedAltPhone = formattedAltPhone.replace(/\s/g, "");
        if (!formattedAltPhone.startsWith("+")) {
          formattedAltPhone = `+91${formattedAltPhone}`;
        }
        formattedAltPhone = formattedAltPhone.replace(/^(\+\d{1,3})(\d)/, "$1 $2");
      }
      
      // Format emergency contact number
      let formattedEmergencyPhone = initialData.emergencyContactNumber || "";
      if (formattedEmergencyPhone) {
        formattedEmergencyPhone = formattedEmergencyPhone.replace(/\s/g, "");
        if (!formattedEmergencyPhone.startsWith("+")) {
          formattedEmergencyPhone = `+91${formattedEmergencyPhone}`;
        }
        formattedEmergencyPhone = formattedEmergencyPhone.replace(/^(\+\d{1,3})(\d)/, "$1 $2");
      }
      
      // Parse date of birth
      let parsedDOB: Date | undefined = undefined;
      if (initialData.dateOfBirth) {
        try {
          parsedDOB = new Date(initialData.dateOfBirth);
          // Validate the date
          if (isNaN(parsedDOB.getTime())) {
            console.warn("⚠️ Invalid date of birth:", initialData.dateOfBirth);
            parsedDOB = undefined;
          }
        } catch (error) {
          console.error("❌ Error parsing date of birth:", error);
          parsedDOB = undefined;
        }
      }
      
      // Parse insurance validity date
      let parsedInsuranceDate: Date | undefined = undefined;
      if (initialData.insuranceValidityDate) {
        try {
          parsedInsuranceDate = new Date(initialData.insuranceValidityDate);
          if (isNaN(parsedInsuranceDate.getTime())) {
            parsedInsuranceDate = undefined;
          }
        } catch (error) {
          console.error("❌ Error parsing insurance date:", error);
        }
      }
      
      // Parse pollution certificate validity date
      let parsedPollutionDate: Date | undefined = undefined;
      if (initialData.pollutionCertificateValidity) {
        try {
          parsedPollutionDate = new Date(initialData.pollutionCertificateValidity);
          if (isNaN(parsedPollutionDate.getTime())) {
            parsedPollutionDate = undefined;
          }
        } catch (error) {
          console.error("❌ Error parsing pollution certificate date:", error);
        }
      }
      
      const newFormData = {
        fullName: initialData.name || "",
        dateOfBirth: parsedDOB,
        gender: initialData.gender || "",
        mobileNumber: formattedPhone,
        alternateMobileNumber: formattedAltPhone,
        email: initialData.email || "",
        profilePhoto: null,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India", // Default to India if not set
        pincode: initialData.pincode || "",
        aadharNumber: initialData.aadharNumber || "",
        drivingLicenseNumber: initialData.licenseNumber || "",
        vehicleRC: null,
        idProofDocuments: null,
        vehicleType: initialData.vehicleType || "",
        vehicleModel: initialData.vehicleModel || "",
        vehicleNumber: initialData.vehicleNumber || "",
        insuranceValidityDate: parsedInsuranceDate,
        pollutionCertificateValidity: parsedPollutionDate,
        emergencyContactName: initialData.emergencyContactName || "",
        emergencyRelationship: initialData.emergencyRelationship || "",
        emergencyContactNumber: formattedEmergencyPhone,
        password: "",
        status: initialData.applicationStatus || "pending",
      };
      
      setFormData(newFormData);
      
      console.log("✅ Form data loaded successfully:", {
        fullName: newFormData.fullName,
        dateOfBirth: newFormData.dateOfBirth,
        gender: newFormData.gender,
        phone: newFormData.mobileNumber,
        email: newFormData.email,
        vehicleModel: newFormData.vehicleModel,
        aadharNumber: newFormData.aadharNumber,
        city: newFormData.city,
        state: newFormData.state,
        country: newFormData.country,
      });
    }
  }, [mode, initialData]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.mobileNumber || !formData.email) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.vehicleType || !formData.vehicleNumber || !formData.drivingLicenseNumber) {
      toast.error("Vehicle details and license number are required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "edit" && partnerId) {
        // Update existing partner
        const { updateDeliveryPartner } = await import("@/services/deliveryPartnerService");

        const updateData: UpdateDeliveryPartnerData = {
          name: formData.fullName,
          email: formData.email,
          phone: formData.mobileNumber.replace(/\D/g, ""), // Remove non-digits
          dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
          gender: formData.gender || undefined,
          alternateMobileNumber: formData.alternateMobileNumber || undefined,
          vehicleType: formData.vehicleType,
          vehicleModel: formData.vehicleModel || undefined,
          vehicleNumber: formData.vehicleNumber.toUpperCase(),
          licenseNumber: formData.drivingLicenseNumber.toUpperCase(),
          aadharNumber: formData.aadharNumber || undefined,
          address: `${formData.addressLine1}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}`,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country || undefined,
          insuranceValidityDate: formData.insuranceValidityDate ? formData.insuranceValidityDate.toISOString() : undefined,
          pollutionCertificateValidity: formData.pollutionCertificateValidity ? formData.pollutionCertificateValidity.toISOString() : undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyRelationship: formData.emergencyRelationship || undefined,
          emergencyContactNumber: formData.emergencyContactNumber || undefined,
        };

        // Prepare files object
        const files = {
          profilePhoto: formData.profilePhoto || undefined,
          aadharDocument: undefined,
          licenseDocument: undefined,
          vehicleRCDocument: formData.vehicleRC || undefined,
          insuranceDocument: undefined,
          pollutionCertDocument: undefined,
          idProofDocument: formData.idProofDocuments || undefined,
        };

        const response = await updateDeliveryPartner(partnerId, updateData, files);

        toast.success("Delivery Partner updated successfully!", {
          description: `Partner ${response.data.name} has been updated.`,
        });

        // Redirect after success
        setTimeout(() => {
          router.push(`/dashboard/delivery-partner/profile/${partnerId}`);
        }, 1500);
      } else {
        // Create new partner
        const { createDeliveryPartner } = await import("@/services/deliveryPartnerService");

        const apiData: CreateDeliveryPartnerData = {
          name: formData.fullName,
          email: formData.email,
          phone: formData.mobileNumber.replace(/\D/g, ""), // Remove non-digits
          dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
          gender: formData.gender || undefined,
          alternateMobileNumber: formData.alternateMobileNumber || undefined,
          vehicleType: formData.vehicleType,
          vehicleModel: formData.vehicleModel || undefined,
          vehicleNumber: formData.vehicleNumber.toUpperCase(),
          licenseNumber: formData.drivingLicenseNumber.toUpperCase(),
          aadharNumber: formData.aadharNumber || undefined,
          address: `${formData.addressLine1}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}`,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country || undefined,
          insuranceValidityDate: formData.insuranceValidityDate ? formData.insuranceValidityDate.toISOString() : undefined,
          pollutionCertificateValidity: formData.pollutionCertificateValidity ? formData.pollutionCertificateValidity.toISOString() : undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyRelationship: formData.emergencyRelationship || undefined,
          emergencyContactNumber: formData.emergencyContactNumber || undefined,
          applicationStatus: formData.status as "pending" | "verified" | "approved" | "rejected",
          password: formData.password || undefined, // Send password if provided, otherwise backend will auto-generate
        };

        // Prepare files object
        const files = {
          profilePhoto: formData.profilePhoto || undefined,
          aadharDocument: undefined,
          licenseDocument: undefined,
          vehicleRCDocument: formData.vehicleRC || undefined,
          insuranceDocument: undefined,
          pollutionCertDocument: undefined,
          idProofDocument: formData.idProofDocuments || undefined,
        };

        const response = await createDeliveryPartner(apiData, files);

        // Show appropriate message based on status
        if (formData.status === "approved") {
          const passwordMessage = formData.password 
            ? "Your custom password will be sent via email." 
            : "Auto-generated password will be sent via email.";
          
          toast.success("Delivery Partner created and approved!", {
            description: `Partner ${response.data.name} has been approved. ${passwordMessage}`,
            duration: 5000,
          });
        } else {
          toast.success("Delivery Partner created successfully!", {
            description: `Partner ${response.data.name} has been added with ${formData.status} status.`,
          });
        }

        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard/delivery-partner");
        }, 1500);
      }
    } catch (error: unknown) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} partner:`, error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} delivery partner`, {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit"
              ? "Edit Delivery Partner"
              : "Add Delivery Partner Manually"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "edit"
              ? "Update delivery partner information"
              : "Create a new delivery partner account"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <p className="text-sm text-muted-foreground">
              Basic details about the delivery partner
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="flex gap-0">
                  {/* Day Dropdown */}
                  <Select
                    key={`day-${formData.dateOfBirth?.getDate()}`}
                    value={formData.dateOfBirth ? formData.dateOfBirth.getDate().toString() : ""}
                    onValueChange={(value) => {
                      const currentDate = formData.dateOfBirth || new Date(2000, 0, 1);
                      const newDate = new Date(currentDate);
                      newDate.setDate(parseInt(value));
                      handleChange("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger className="rounded-r-none border-r-0">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Month Dropdown */}
                  <Select
                    key={`month-${formData.dateOfBirth?.getMonth()}`}
                    value={formData.dateOfBirth ? formData.dateOfBirth.getMonth().toString() : ""}
                    onValueChange={(value) => {
                      const currentDate = formData.dateOfBirth || new Date(2000, 0, 1);
                      const newDate = new Date(currentDate);
                      newDate.setMonth(parseInt(value));
                      handleChange("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger className="rounded-none border-r-0">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Year Dropdown */}
                  <Select
                    key={`year-${formData.dateOfBirth?.getFullYear()}`}
                    value={formData.dateOfBirth ? formData.dateOfBirth.getFullYear().toString() : ""}
                    onValueChange={(value) => {
                      const currentDate = formData.dateOfBirth || new Date(2000, 0, 1);
                      const newDate = new Date(currentDate);
                      newDate.setFullYear(parseInt(value));
                      handleChange("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger className="rounded-l-none">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 18 - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.dateOfBirth && !isNaN(formData.dateOfBirth.getTime()) && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {format(formData.dateOfBirth, "MMMM d, yyyy")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  key={`gender-${formData.gender}`}
                  value={formData.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="mobileNumber"
                  country={formData.country}
                  value={formData.mobileNumber}
                  onChange={(value) => handleChange("mobileNumber", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternateMobileNumber">
                  Alternate Mobile Number
                </Label>
                <PhoneInput
                  id="alternateMobileNumber"
                  country={formData.country}
                  value={formData.alternateMobileNumber}
                  onChange={(value) => handleChange("alternateMobileNumber", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="partner@example.com"
                  required
                  disabled={mode === "edit"} // Disable email change in edit mode
                />
                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed as it&apos;s used for authentication.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo (Max 10MB)</Label>
                {mode === "edit" && initialData?.profilePhotoUrl && (
                  <div className="mb-2">
                    <a 
                      href={initialData.profilePhotoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View current photo
                    </a>
                  </div>
                )}
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("Profile photo must be less than 10MB");
                        e.target.value = "";
                        return;
                      }
                      handleFileChange("profilePhoto", file);
                    } else {
                      handleFileChange("profilePhoto", null);
                    }
                  }}
                />
                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground">
                    Upload a new file to replace the existing one
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Address Details</h2>
            <p className="text-sm text-muted-foreground">
              Residential address information
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pincode */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-destructive">*</span>
                </Label>
                <ZipCodeInput
                  id="pincode"
                  country={formData.country}
                  state={formData.state}
                  city={formData.city}
                  value={formData.pincode}
                  onChange={(value) => handleChange("pincode", value)}
                  onLocationSelect={(location) => {
                    setFormData((prev) => ({
                      ...prev,
                      city: location.city !== undefined ? location.city : prev.city,
                      state: location.state !== undefined ? location.state : prev.state,
                      country: location.country !== undefined ? location.country : prev.country,
                    }));
                  }}
                />
              </div>

              {/* Country, State, City */}
              <div className="col-span-2">
                <CountryStateCitySelect
                  key={`location-${formData.country}-${formData.state}-${formData.city}`}
                  value={{
                    country: formData.country,
                    state: formData.state,
                    city: formData.city,
                  }}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      country: value.country,
                      state: value.state,
                      city: value.city,
                    }));
                  }}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* ID Proof & Verification */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">ID Proof & Verification Documents</h2>
            <p className="text-sm text-muted-foreground">
              Upload identity and vehicle documents
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number</Label>
                <Input
                  id="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={(e) => handleChange("aadharNumber", e.target.value)}
                  placeholder="1234 5678 9012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drivingLicenseNumber">
                  Driving License Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="drivingLicenseNumber"
                  value={formData.drivingLicenseNumber}
                  onChange={(e) =>
                    handleChange("drivingLicenseNumber", e.target.value)
                  }
                  placeholder="DL-1234567890"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleRC">Vehicle RC Upload</Label>
                {mode === "edit" && initialData?.vehicleRCDocumentUrl && (
                  <div className="mb-2 p-2 bg-muted rounded-md">
                    <a 
                      href={initialData.vehicleRCDocumentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                    >
                      📄 View current document
                    </a>
                  </div>
                )}
                <Input
                  id="vehicleRC"
                  type="file"
                  accept="*"
                  onChange={(e) =>
                    handleFileChange("vehicleRC", e.target.files?.[0] || null)
                  }
                />
                {mode === "edit" && initialData?.vehicleRCDocumentUrl && (
                  <p className="text-xs text-muted-foreground">
                    Upload a new file to replace the existing one
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProofDocuments">ID Proof Documents</Label>
                {mode === "edit" && initialData?.idProofDocumentUrl && (
                  <div className="mb-2 p-2 bg-muted rounded-md">
                    <a 
                      href={initialData.idProofDocumentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                    >
                      📄 View current document
                    </a>
                  </div>
                )}
                <Input
                  id="idProofDocuments"
                  type="file"
                  accept="*"
                  onChange={(e) =>
                    handleFileChange(
                      "idProofDocuments",
                      e.target.files?.[0] || null
                    )
                  }
                />
                {mode === "edit" && initialData?.idProofDocumentUrl && (
                  <p className="text-xs text-muted-foreground">
                    Upload a new file to replace the existing one
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Vehicle Details</h2>
            <p className="text-sm text-muted-foreground">
              Vehicle information and documentation
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">
                  Vehicle Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  key={`vehicleType-${formData.vehicleType}`}
                  value={formData.vehicleType}
                  onValueChange={(value) => handleChange("vehicleType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => handleChange("vehicleModel", e.target.value)}
                  placeholder="Honda Activa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">
                  Vehicle Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    handleChange("vehicleNumber", e.target.value)
                  }
                  placeholder="MH02AB1234"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceValidityDate">
                  Insurance Validity Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.insuranceValidityDate
                        ? format(formData.insuranceValidityDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.insuranceValidityDate}
                      onSelect={(date) =>
                        handleChange("insuranceValidityDate", date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pollutionCertificateValidity">
                  Pollution Certificate Validity
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.pollutionCertificateValidity
                        ? format(formData.pollutionCertificateValidity, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.pollutionCertificateValidity}
                      onSelect={(date) =>
                        handleChange("pollutionCertificateValidity", date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Emergency Contact</h2>
            <p className="text-sm text-muted-foreground">
              Emergency contact person details
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">
                  Contact Person Name
                </Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    handleChange("emergencyContactName", e.target.value)
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyRelationship}
                  onChange={(e) =>
                    handleChange("emergencyRelationship", e.target.value)
                  }
                  placeholder="Father, Mother, Spouse, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Contact Number</Label>
                <PhoneInput
                  id="emergencyContactNumber"
                  country={formData.country}
                  value={formData.emergencyContactNumber}
                  onChange={(value) =>
                    handleChange("emergencyContactNumber", value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Account Settings</h2>
            <p className="text-sm text-muted-foreground">
              Login credentials and account status
            </p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === "create" && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Temporary Password (Optional)
                  </Label>
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Leave empty for auto-generate"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.password 
                      ? "This password will be sent to the partner via email" 
                      : "If empty, a secure password will be auto-generated"}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  key={`status-${formData.status}`}
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                  disabled={mode === "edit"} // Disable status change in edit mode
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground">
                    Status cannot be changed here. Use the status management options in the partner list.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <Separator />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (mode === "edit" ? "Updating..." : "Creating...") 
              : (mode === "edit" ? "Update Partner" : "Create Delivery Partner")
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
