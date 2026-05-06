"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/components/ui/currency-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { ZipCodeInput } from "@/components/ui/zipcode-input";
import { CountryStateCitySelect } from "@/components/ui/country-state-city-select";
import { Country } from "country-state-city";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Building2, Globe, Clock, AlertCircle, User, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";   
import { Separator } from "@/components/ui/separator";
import { getExampleNumber, CountryCode, getCountryCallingCode } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

interface OnboardingData {
  // Personal Information
  name: string;
  phoneNumber: string;
  
  // Business Information
  companyName: string;
  gstNumber: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // System Configuration
  currency: string;
  // timezone: string;
  // dateFormat: string;
}

// TEMPORARILY HIDDEN - Get all available timezones with UTC offset using Luxon
// const getAllTimezones = () => {
//   const timezones = [
//     "Asia/Kolkata",
//     "America/New_York",
//     "America/Los_Angeles",
//     "America/Chicago",
//     "Europe/London",
//     "Europe/Paris",
//     "Europe/Berlin",
//     "Asia/Dubai",
//     "Asia/Singapore",
//     "Asia/Tokyo",
//     "Asia/Shanghai",
//     "Asia/Hong_Kong",
//     "Australia/Sydney",
//     "Australia/Melbourne",
//     "Pacific/Auckland",
//     "America/Toronto",
//     "America/Vancouver",
//     "America/Mexico_City",
//     "America/Sao_Paulo",
//     "Africa/Cairo",
//     "Africa/Johannesburg",
//   ];

//   return timezones.map(tz => {
//     const dt = DateTime.now().setZone(tz);
//     const offset = dt.toFormat('ZZ');
//     return {
//       value: tz,
//       label: `${tz.replace(/_/g, ' ')} (UTC${offset})`,
//     };
//   }).sort((a, b) => a.label.localeCompare(b.label));
// };

// const TIMEZONES = getAllTimezones();

// const DATE_FORMATS = [
//   { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
//   { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
//   { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
// ];

export function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // TEMPORARILY HIDDEN - Auto-detect user's timezone
  // const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    phoneNumber: "",
    companyName: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    currency: "INR",
    // timezone: detectedTimezone || "Asia/Kolkata", // Use detected timezone
    // dateFormat: "DD/MM/YYYY",
  });

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // GST Number validation
  const validateGSTNumber = (gstNumber: string): boolean => {
    if (!gstNumber) return true; // Optional field
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  };

  // Phone number validation based on country
  const validatePhoneNumber = (phoneNumber: string, country: string): boolean => {
    if (!phoneNumber) return false;
    
    // Get country ISO code
    const allCountries = Country.getAllCountries();
    const foundCountry = allCountries.find(
      (c) => c.name.toLowerCase() === country.toLowerCase()
    );
    const countryCode = foundCountry?.isoCode || "IN";
    
    // Get exact phone length from libphonenumber-js
    try {
      const exampleNumber = getExampleNumber(countryCode as CountryCode, examples);
      if (exampleNumber) {
        const expectedLength = exampleNumber.nationalNumber.length;
        const digitsOnly = phoneNumber.replace(/\D/g, "");
        
        // Remove country code if present at the start
        const callingCode = `+${getCountryCallingCode(countryCode as CountryCode)}`;
        const callingCodeDigits = callingCode.replace(/\D/g, "");
        const nationalNumber = digitsOnly.startsWith(callingCodeDigits) 
          ? digitsOnly.slice(callingCodeDigits.length) 
          : digitsOnly;
        
        return nationalNumber.length === expectedLength;
      }
    } catch {
      // Fallback validation
    }
    
    // Fallback: just check if it has digits
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!validatePhoneNumber(formData.phoneNumber, formData.country)) {
      toast.error("Invalid phone number", {
        description: "Please enter a valid phone number for the selected country",
      });
      return false;
    }
    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!formData.state) {
      toast.error("Please select your state");
      return false;
    }
    if (!formData.country) {
      toast.error("Please select your country");
      return false;
    }
    if (!formData.currency) {
      toast.error("Please select your currency");
      return false;
    }
    // TEMPORARILY HIDDEN - Timezone and date format validation
    // if (!formData.timezone) {
    //   toast.error("Please select your timezone");
    //   return false;
    // }
    // if (!formData.dateFormat) {
    //   toast.error("Please select date format");
    //   return false;
    // }
    if (formData.gstNumber && !validateGSTNumber(formData.gstNumber)) {
      toast.error("Invalid GST Number", {
        description: "Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Validate zipcode matches city/state for India
      if (formData.country  && formData.zipCode && formData.zipCode.length === 6) {
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${formData.zipCode}`);
          const data = await response.json();
          
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
            const postOffices: Array<{ State: string; District: string; [key: string]: string | number | boolean }> = data[0].PostOffice;
            const matchesState = postOffices.some((po) => 
              po.State.toLowerCase() === formData.state.toLowerCase()
            );
            
            if (!matchesState) {
              toast.error("Invalid ZIP Code", {
                description: `ZIP code ${formData.zipCode} does not belong to ${formData.state}`,
              });
              setIsSubmitting(false);
              return;
            }

            if (formData.city) {
              const matchesCity = postOffices.some((po) => 
                po.District.toLowerCase() === formData.city.toLowerCase()
              );
              
              if (!matchesCity) {
                toast.error("Invalid ZIP Code", {
                  description: `ZIP code ${formData.zipCode} does not belong to ${formData.city}, ${formData.state}`,
                });
                setIsSubmitting(false);
                return;
              }
            }
          } else {
            toast.error("Invalid ZIP Code", {
              description: "Please enter a valid Indian pincode",
            });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error("Error validating zipcode:", error);
          // Continue with submit if validation API fails
        }
      }

      const response = await axiosInstance.put("/api/auth/admin/onboarding", {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
        gstNumber: formData.gstNumber || undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        currency: formData.currency,
        // TEMPORARILY HIDDEN - Timezone and date format
        // timezone: formData.timezone,
        // dateFormat: formData.dateFormat,
        onboardingCompleted: true,
      });

      if (response.data.success) {
        toast.success("Setup completed successfully!", {
          description: "Welcome to your dashboard",
        });

        // Update localStorage with complete user data from backend
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          // Merge backend response data with existing user data
          const updatedUserData = {
            ...userData,
            ...response.data.data,
            role: "admin", // Ensure role is preserved
          };
          localStorage.setItem("user", JSON.stringify(updatedUserData));
          
          // Trigger auth refresh event for other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-refresh'));
          }
        }

        // Redirect to dashboard
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="text-center space-y-2 px-4 sm:px-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold">
          Welcome! Let&apos;s Set Up Your Store
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Complete this one-time setup to configure your business settings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                Important: One-Time Configuration
              </h4>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                These settings are permanent and cannot be changed after setup. Please choose carefully!
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your contact details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="h-10 sm:h-11 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <PhoneInput
                id="phoneNumber"
                country={formData.country}
                value={formData.phoneNumber}
                onChange={(value) => handleInputChange("phoneNumber", value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Business Information */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Business Information</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Details about your business
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Enter your company name"
                className="h-10 sm:h-11 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This will appear on invoices and receipts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber" className="text-sm">
                GST Number (Optional)
              </Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                placeholder="e.g., 22AAAAA0000A1Z5"
                maxLength={15}
                className={`h-10 sm:h-11 text-sm ${
                  formData.gstNumber && !validateGSTNumber(formData.gstNumber)
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              {formData.gstNumber && !validateGSTNumber(formData.gstNumber) && (
                <p className="text-xs text-red-500">
                  Invalid GST format (15 characters)
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Address Information */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Address Information</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your business location
              </p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your address"
                className="h-10 sm:h-11 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm">
                  ZIP Code
                </Label>
                <ZipCodeInput
                  id="zipCode"
                  country={formData.country}
                  state={formData.state}
                  city={formData.city}
                  value={formData.zipCode}
                  onChange={(value) => handleInputChange("zipCode", value)}
                  onLocationSelect={(location) => {
                    if (location.city !== undefined) handleInputChange("city", location.city);
                    if (location.state !== undefined) handleInputChange("state", location.state);
                    if (location.country !== undefined) handleInputChange("country", location.country);
                  }}
                  className="h-10 sm:h-11"
                />
              </div>
            </div>

            <CountryStateCitySelect
              value={{
                country: formData.country,
                state: formData.state,
                city: formData.city,
              }}
              onChange={(value) => {
                handleInputChange("country", value.country);
                handleInputChange("state", value.state);
                handleInputChange("city", value.city);
              }}
              required
              countryLabel="Country *"
              stateLabel="State *"
              cityLabel="City"
            />
          </div>
        </div>

        <Separator />

        {/* System Configuration */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">System Configuration</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Regional settings (cannot be changed later)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm">
                Currency <span className="text-destructive">*</span>
              </Label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
                placeholder="Select currency"
                className="w-full h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground">
                All prices will use this currency
              </p>
            </div>

            {/* TEMPORARILY HIDDEN - Timezone and Date Format */}
            {/* <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm">
                Timezone <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-sm">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Affects timestamps
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-sm">
                Date Format <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(value) => handleInputChange("dateFormat", value)}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value} className="text-sm">
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Display format
              </p>
            </div> */}
          </div>
        </div>

        <Separator />

        {/* Configuration Summary */}
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            Configuration Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium text-right truncate">{formData.name || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium text-right truncate">{formData.companyName || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">State:</span>
              <span className="font-medium text-right truncate">{formData.state || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Country:</span>
              <span className="font-medium text-right truncate">{formData.country}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Currency:</span>
              <span className="font-medium text-right">{formData.currency}</span>
            </div>
            {/* TEMPORARILY HIDDEN - Timezone and Date Format Display */}
            {/* <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Date Format:</span>
              <span className="font-medium text-right">{formData.dateFormat}</span>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2">
              <span className="text-muted-foreground">Timezone:</span>
              <span className="font-medium text-right truncate">
                {formData.timezone} ({DateTime.now().setZone(formData.timezone).toFormat('HH:mm')})
              </span>
            </div> */}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-11 sm:h-12 text-sm sm:text-base"
          size="lg"
        >
          {isSubmitting ? "Completing Setup..." : "Complete Setup & Continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
