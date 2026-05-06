"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLocation } from "@/context/LocationContext";
import { X, CheckCircle2, XCircle, Loader2, Search, ChevronDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import { 
  detectLocationByCoords, 
  type PincodeCheckResult, 
  type DeliveryZone 
} from "@/services/deliveryZoneService";
import { getWebSettings } from "@/services/online-services/webSettingsService";
import type { WebSettings } from "@/services/online-services/webSettingsService";

export default function DeliveryLocationModal() {
  const [webSettings, setWebSettings] = useState<WebSettings | null>(null);
  const {
    isModalOpen,
    setIsModalOpen,
    checkPincode,
    saveLocation,
    availableCountries,
    selectedCountry,
    setSelectedCountry,
    isLoading,
  } = useLocation();

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const hasAttemptedRef = useRef(false);
  const [result, setResult] = useState<{
    serviceable: boolean;
    message: string;
    city?: string;
    state?: string;
    country?: string;
    area?: string;
  } | null>(null);

  // Fetch web settings for logo
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getWebSettings();
        setWebSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch web settings:", error);
      }
    };
    fetchSettings();
  }, []);

  if (!isModalOpen) return null;

  const handleCheck = async () => {
    if (!pincode.trim()) return;

    const res = await checkPincode(pincode.trim(), selectedCountry);
    setResult({
      serviceable: res.serviceable,
      message: res.message,
      city: res.data?.city,
      state: res.data?.state,
      country: res.data?.country,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await detectLocationByCoords(latitude, longitude);
          
          if (res.success && res.data) {
            const detectedPincode = res.data.pincode;
            const detectedCountry = res.data.country;
            
            setPincode(detectedPincode);
            setSelectedCountry(detectedCountry);
            
            // Automatically trigger the check logic
            const checkRes = await checkPincode(detectedPincode, detectedCountry, res.data.city, res.data.state);
            
            setResult({
              serviceable: checkRes.serviceable,
              message: checkRes.message,
              city: checkRes.data?.city || res.data.city,
              state: checkRes.data?.state || res.data.state,
              country: checkRes.data?.country || res.data.country,
              area: res.data.area,
            });

            if (checkRes.serviceable) {
              const locationDisplay = res.data.area ? `${res.data.area}, ${res.data.city}` : res.data.city;
              toast.success(`Location detected: ${locationDisplay}`);
            } else {
              const locationDisplay = res.data.area ? `${res.data.area}, ${res.data.city}` : res.data.city;
              toast.info(`Location detected: ${locationDisplay}, but we don't deliver here yet.`);
            }
          }
        } catch (error) {
          console.error("Geolocation error:", error);
          toast.error("Failed to detect your precise location");
        }
      },
      (error) => {
        toast.error("Geolocation permission denied or target location unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Perfect Accuracy settings
    );
  };

  const handleContinue = () => {
    if (result?.serviceable) {
      saveLocation({
        pincode: pincode.trim(),
        city: result.city || "",
        state: result.state || "",
        country: result.country || selectedCountry,
        isServiceable: true,
      });
      setIsModalOpen(false);
      setResult(null);
      setIsCountryDropdownOpen(false);
      setPincode("");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setResult(null);
    setPincode("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            {webSettings?.logoUrl && webSettings.logoUrl.trim() !== '' ? (
              <Image
                src={webSettings.logoUrl}
                alt="Company Logo"
                width={120}
                height={48}
                className="h-16 w-auto object-contain"
                priority={false}
                quality={90}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-16 flex items-center">
                <span className="text-[#e63946] font-bold text-3xl">
                  LEATS
                </span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Choose delivery location
          </h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Enter your pincode to check delivery availability
          </p>
        </div>

        {/* Pincode Input */}
        <div className="relative mb-4">
          <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-[#e63946] transition-colors">
            <div className="pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Enter your pincode..."
              value={pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Allow only digits
                setPincode(value);
                setResult(null);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-3 text-gray-700 focus:outline-none text-sm"
              maxLength={15}
              autoFocus
            />
            <button
              onClick={handleCheck}
              disabled={!pincode.trim() || isLoading}
              className="px-4 py-3 bg-[#e63946] text-white font-medium text-sm hover:bg-[#d32f3c] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check"
              )}
            </button>
          </div>
        </div>

        {/* Use Current Location Button */}
        {/* <button
          onClick={handleDetectLocation}
          className="w-full mb-6 flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-[#e63946] hover:text-[#e63946] transition-all group"
        >
          <MapPin className="h-4 w-4 text-[#e63946] group-hover:animate-bounce" />
          Use current location
        </button> */}

        {/* Country Selector Dropdown */}
        <div className="relative flex flex-col items-center mb-6">
          <button
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#e63946] hover:bg-gray-50 transition-all group"
          >
            <span className="text-lg">
              {selectedCountry === "India" ? "🇮🇳" : 
               selectedCountry === "Malaysia" ? "🇲🇾" : 
               (selectedCountry === "UAE" || selectedCountry === "United Arab Emirates") ? "🇦🇪" : "🌐"}
            </span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {selectedCountry}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-[#e63946] transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isCountryDropdownOpen && (
            <div className="absolute top-full mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {availableCountries.length > 0 ? (
                availableCountries.map((country) => (
                  <button
                    key={country}
                    onClick={() => {
                      setSelectedCountry(country);
                      setIsCountryDropdownOpen(false);
                      setResult(null); // Clear previous check when country changes
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                      selectedCountry === country ? "text-[#e63946] font-bold bg-[#e63946]/5" : "text-gray-600 font-medium"
                    }`}
                  >
                    <span className="text-lg">
                      {country === "India" ? "🇮🇳" : 
                       country === "Malaysia" ? "🇲🇾" : 
                       (country === "UAE" || country === "United Arab Emirates") ? "🇦🇪" : "🌐"}
                    </span>
                    <span className="uppercase">{country}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-gray-400 italic">No zones configured</div>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-lg border-2 mb-4 ${
              result.serviceable
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.serviceable ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium text-sm ${
                    result.serviceable ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.serviceable
                    ? "Delivery available!"
                    : "Not serviceable"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    result.serviceable ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {result.serviceable
                    ? `📍 ${result.area ? result.area + ', ' : ''}${result.city}, ${result.state}`
                    : result.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {result?.serviceable && (
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-[#e63946] text-white font-semibold rounded-lg hover:bg-[#d32f3c] transition-colors text-sm"
          >
            Continue Shopping
          </button>
        )}

        {/* Skip text */}
        {!result?.serviceable && (
          <p className="text-center text-xs text-gray-400 mt-3">
            <button
              onClick={handleClose}
              className="hover:text-gray-600 underline transition-colors"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
