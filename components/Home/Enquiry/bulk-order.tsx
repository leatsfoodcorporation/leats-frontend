"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";

interface BulkOrderFormData {
  name: string;
  phone: string;
  companyName: string;
  productDetails: string;
  quantity: string;
  deliveryDate: string;
  message: string;
}

export default function BulkOrderForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BulkOrderFormData>({
    name: "",
    phone: "",
    companyName: "",
    productDetails: "",
    quantity: "",
    deliveryDate: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.phone || !formData.productDetails || !formData.quantity) {
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
      const response = await axiosInstance.post("/api/enquiry/bulk-order", formData);

      if (response.data.success) {
        toast.success("Bulk order enquiry submitted successfully! We'll contact you soon.");
        
        // Reset form
        setFormData({
          name: "",
          phone: "",
          companyName: "",
          productDetails: "",
          quantity: "",
          deliveryDate: "",
          message: "",
        });
      }
    } catch (error: any) {
      console.error("Error submitting bulk order enquiry:", error);
      const errorMessage = error.response?.data?.error || "Failed to submit enquiry";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-8 md:py-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-sm sm:shadow-lg">
          <CardHeader className="space-y-2 sm:space-y-3 text-center px-4 sm:px-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-[#e63946] rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
              Bulk Order Enquiry
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base px-2">
              Need to order in large quantities? Fill out the form below and our team will get back to you with the best pricing and delivery options.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Contact Information</h3>
                
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

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name (Optional)
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="ABC Corporation"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Order Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="productDetails" className="text-sm font-medium">
                    Product Details <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="productDetails"
                    name="productDetails"
                    placeholder="Please specify the products you need (e.g., Rice - 25kg bags, Cooking Oil - 5L cans)"
                    value={formData.productDetails}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Estimated Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="text"
                      placeholder="e.g., 100 units, 500 kg"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate" className="text-sm font-medium">
                      Expected Delivery Date
                    </Label>
                    <Input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Additional Requirements
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Any special requirements, delivery instructions, or questions..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 sm:pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-semibold py-4 sm:py-6 text-sm sm:text-base md:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Bulk Order Enquiry"
                  )}
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-center text-gray-500">
                By submitting this form, you agree to our terms and conditions. We&apos;ll contact you within 24-48 hours.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
