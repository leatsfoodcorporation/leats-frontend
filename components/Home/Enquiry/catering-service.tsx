"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";

interface CateringServiceFormData {
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
}

const eventTypes = [
  "Wedding",
  "Birthday Party",
  "Corporate Event",
  "Anniversary",
  "Festival Celebration",
  "House Warming",
  "Other",
];

export default function CateringServiceForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CateringServiceFormData>({
    name: "",
    phone: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    guestCount: "",
    venue: "",
    menuPreferences: "",
    budget: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.phone || !formData.eventType || !formData.eventDate || !formData.guestCount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/enquiry/catering-service", formData);

      if (response.data.success) {
        toast.success("Catering service enquiry submitted successfully! We'll contact you soon.");
        
        // Reset form
        setFormData({
          name: "",
          phone: "",
          eventType: "",
          eventDate: "",
          eventTime: "",
          guestCount: "",
          venue: "",
          menuPreferences: "",
          budget: "",
          message: "",
        });
      }
    } catch (error: any) {
      console.error("Error submitting catering service enquiry:", error);
      const errorMessage = error.response?.data?.error || "Failed to submit enquiry";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-[#e63946] rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Catering Service Enquiry
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Planning an event? Let us handle the catering! Fill out the form below and we'll create a customized menu for your special occasion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      maxLength={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="eventType" className="text-sm font-medium">
                    Event Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.eventType} onValueChange={handleSelectChange} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate" className="text-sm font-medium">
                      Event Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventTime" className="text-sm font-medium">
                      Event Time
                    </Label>
                    <Input
                      id="eventTime"
                      name="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestCount" className="text-sm font-medium">
                      Number of Guests <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guestCount"
                      name="guestCount"
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.guestCount}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium">
                      Budget Range (Optional)
                    </Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="text"
                      placeholder="e.g., ₹50,000 - ₹1,00,000"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-medium">
                    Event Venue
                  </Label>
                  <Input
                    id="venue"
                    name="venue"
                    type="text"
                    placeholder="e.g., ABC Banquet Hall, City Name"
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menuPreferences" className="text-sm font-medium">
                    Menu Preferences
                  </Label>
                  <Textarea
                    id="menuPreferences"
                    name="menuPreferences"
                    placeholder="Please specify your menu preferences (e.g., Vegetarian, Non-Vegetarian, Vegan, specific cuisines, dietary restrictions)"
                    value={formData.menuPreferences}
                    onChange={handleChange}
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Additional Requirements
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Any special requirements, service preferences, or questions..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-semibold py-6 text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Catering Enquiry"
                  )}
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-center text-gray-500">
                By submitting this form, you agree to our terms and conditions. We'll contact you within 24-48 hours with a customized quote.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
