"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  Star,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  User,
  FileText,
  Home,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getDeliveryPartnerById,
  type DeliveryPartner,
} from "@/services/deliveryPartnerService";
import { useCurrency } from "@/hooks/useCurrency";

interface ManageProfileProps {
  partnerId: string;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  deliveredAt: string;
}

interface PartnerWithOrders extends DeliveryPartner {
  completedOrdersCount?: number;
  recentCompletedOrders?: CompletedOrder[];
}

export default function ManageProfile({ partnerId }: ManageProfileProps) {
  const router = useRouter();
  const currencySymbol = useCurrency();
  const [partner, setPartner] = useState<PartnerWithOrders | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPartnerDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDeliveryPartnerById(partnerId);
      setPartner(response.data);
    } catch (error: unknown) {
      console.error("Error fetching partner details:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to load partner details", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartnerDetails();
  }, [fetchPartnerDetails]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: {
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        label: "Pending",
      },
      verified: {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        label: "Verified",
      },
      approved: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        label: "Approved",
      },
      rejected: {
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        label: "Rejected",
      },
    };

    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Partner not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Delivery Partner Profile</h1>
          <p className="text-sm text-muted-foreground">
            View partner information and completed orders
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/dashboard/delivery-partner/edit/${partnerId}`)
          }
        >
          Edit Profile
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={partner.profilePhotoUrl || undefined} alt={partner.name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(partner.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                {getStatusBadge(partner.applicationStatus)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{partner.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Partner ID: {partner.partnerId || partner.id.slice(-8).toUpperCase()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {partner.city}, {partner.state} - {partner.pincode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{" "}
                    {format(new Date(partner.joiningDate || partner.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-4 md:border-l md:pl-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">
                    {partner.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <Separator />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Package className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {partner.totalDeliveries}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Total Deliveries</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Address
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium text-lg">{partner.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-lg">{partner.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                <p className="font-medium text-lg">{partner.phone}</p>
              </div>
              {partner.alternateMobileNumber && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alternate Phone</p>
                  <p className="font-medium text-lg">{partner.alternateMobileNumber}</p>
                </div>
              )}
              {partner.dateOfBirth && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium text-lg">
                    {format(new Date(partner.dateOfBirth), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {partner.gender && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium text-lg capitalize">{partner.gender}</p>
                </div>
              )}
              {partner.aadharNumber && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aadhar Number</p>
                  <p className="font-medium text-lg">{partner.aadharNumber}</p>
                </div>
              )}
              {partner.emergencyContactName && (
                <>
                  <div className="col-span-full">
                    <Separator className="my-2" />
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Emergency Contact
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                    <p className="font-medium text-lg">{partner.emergencyContactName}</p>
                  </div>
                  {partner.emergencyRelationship && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                      <p className="font-medium text-lg capitalize">{partner.emergencyRelationship}</p>
                    </div>
                  )}
                  {partner.emergencyContactNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Contact Number</p>
                      <p className="font-medium text-lg">{partner.emergencyContactNumber}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Address Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <p className="text-sm text-muted-foreground mb-1">Full Address</p>
                <p className="font-medium text-lg">{partner.address || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">City</p>
                <p className="font-medium text-lg">{partner.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">State</p>
                <p className="font-medium text-lg">{partner.state}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pincode</p>
                <p className="font-medium text-lg">{partner.pincode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Country</p>
                <p className="font-medium text-lg">{partner.country || "India"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Tab */}
        <TabsContent value="vehicle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vehicle Type</p>
                <p className="font-medium text-lg capitalize">{partner.vehicleType}</p>
              </div>
              {partner.vehicleModel && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Model</p>
                  <p className="font-medium text-lg">{partner.vehicleModel}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vehicle Number</p>
                <p className="font-medium text-lg">{partner.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">License Number</p>
                <p className="font-medium text-lg">{partner.licenseNumber}</p>
              </div>
              {partner.insuranceValidityDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Insurance Valid Until</p>
                  <p className="font-medium text-lg">
                    {format(new Date(partner.insuranceValidityDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {partner.pollutionCertificateValidity && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pollution Certificate Valid Until</p>
                  <p className="font-medium text-lg">
                    {format(new Date(partner.pollutionCertificateValidity), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partner.profilePhotoUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Profile Photo</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.profilePhotoUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.aadharDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Aadhar Card</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.aadharDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.licenseDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Driving License</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.licenseDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.vehicleRCDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Vehicle RC</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.vehicleRCDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.insuranceDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Insurance Certificate</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.insuranceDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.pollutionCertDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Pollution Certificate</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.pollutionCertDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {partner.idProofDocumentUrl && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">ID Proof</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(partner.idProofDocumentUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {!partner.profilePhotoUrl && 
               !partner.aadharDocumentUrl && 
               !partner.licenseDocumentUrl && 
               !partner.vehicleRCDocumentUrl && 
               !partner.insuranceDocumentUrl && 
               !partner.pollutionCertDocumentUrl && 
               !partner.idProofDocumentUrl && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-600">
                    {partner.totalDeliveries}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Deliveries</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2 fill-yellow-600" />
                  <p className="text-3xl font-bold text-yellow-600">
                    {partner.rating.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {partner.completedOrdersCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Recent Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partner.recentCompletedOrders && partner.recentCompletedOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partner.recentCompletedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {currencySymbol}{order.total.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.deliveredAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No completed orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
             