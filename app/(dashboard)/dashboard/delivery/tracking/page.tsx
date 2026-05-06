"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Truck,
  MapPin,
  Package,
  Phone,
  Star,
  Navigation,
  RefreshCw,
  Users,
  Car,
  Wifi,
  WifiOff,
  Locate,
} from "lucide-react";
import {
  getAvailablePartnersForAssignment,
  getInTransitOrders,
} from "@/services/deliveryPartnerService";
import { useSocket } from "@/components/providers/socket-provider";
import { 
  subscribeToOrderEvents, 
  unsubscribeFromOrderEvents,
  subscribeToAdminEvents,
  unsubscribeFromAdminEvents 
} from "@/lib/socket/socketClient";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("@/components/Dashboard/DeliveryMap").then((mod) => mod.DeliveryMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

interface PartnerLocation {
  partnerId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  currentDelivery?: string;
  averageRating: number;
  timestamp: Date;
}

interface ActiveDelivery {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: string;
  estimatedTime?: string;
}

export default function LiveTrackingPage() {
  const [partners, setPartners] = useState<PartnerLocation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerLocation | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchPartner, setSearchPartner] = useState("");
  const { isConnected } = useSocket();

  // Real-time partner location update handler
  const handlePartnerLocationUpdate = useCallback((data: {
    partnerId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
  }) => {
    console.log('📍 Socket received partner location:', data);
    
    setPartners(prev => {
      const existingIndex = prev.findIndex(p => p.partnerId === data.partnerId);
      
      if (existingIndex >= 0) {
        // Update existing partner
        return prev.map(p => 
          p.partnerId === data.partnerId
            ? { ...p, latitude: data.latitude, longitude: data.longitude, timestamp: new Date(data.timestamp), isOnline: true }
            : p
        );
      } else {
        // Add new partner that wasn't in the list
        return [...prev, {
          partnerId: data.partnerId,
          name: 'New Partner',
          phone: '',
          vehicleType: 'bike',
          vehicleNumber: '',
          latitude: data.latitude,
          longitude: data.longitude,
          isOnline: true,
          averageRating: 0,
          timestamp: new Date(data.timestamp),
        }];
      }
    });
    
    // Update selected partner if it's the one being tracked
    if (selectedPartner?.partnerId === data.partnerId) {
      setSelectedPartner(prev => prev ? {
        ...prev,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date(data.timestamp),
        isOnline: true,
      } : null);
    }
    
    setLastUpdate(new Date());
  }, [selectedPartner]);

  // Real-time partner offline handler
  const handlePartnerOffline = useCallback((data: { partnerId: string }) => {
    setPartners(prev => prev.map(p =>
      p.partnerId === data.partnerId
        ? { ...p, isOnline: false }
        : p
    ));
    if (selectedPartner?.partnerId === data.partnerId) {
      setSelectedPartner(prev => prev ? { ...prev, isOnline: false } : null);
    }
  }, [selectedPartner]);

  // Real-time partner online handler
  const handlePartnerOnline = useCallback((data: { partnerId: string }) => {
    console.log('📱 Partner came online:', data.partnerId);
    setPartners(prev => prev.map(p =>
      p.partnerId === data.partnerId
        ? { ...p, isOnline: true }
        : p
    ));
    if (selectedPartner?.partnerId === data.partnerId) {
      setSelectedPartner(prev => prev ? { ...prev, isOnline: true } : null);
    }
  }, [selectedPartner]);

  // Real-time delivery update handler
  const handleDeliveryUpdate = useCallback((data: {
    orderId: string;
    status: string;
    timestamp: Date;
  }) => {
    setActiveDeliveries(prev => prev.map(d =>
      d.orderNumber === data.orderId
        ? { ...d, status: data.status }
        : d
    ));
    toast.info(`Order status updated: ${data.status}`);
    loadData(); // Reload full data on status change
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    if (isConnected) {
      // Subscribe to partner location updates
      subscribeToOrderEvents('', {
        onDeliveryUpdate: handleDeliveryUpdate,
      });
      
      subscribeToAdminEvents({
        onPartnerLocation: handlePartnerLocationUpdate,
        onPartnerOffline: handlePartnerOffline,
        onPartnerOnline: handlePartnerOnline,
        onDeliveryUpdate: handleDeliveryUpdate,
      });

      return () => {
        unsubscribeFromAdminEvents();
        unsubscribeFromOrderEvents('');
      };
    }
  }, [isConnected, handlePartnerLocationUpdate, handlePartnerOffline, handlePartnerOnline, handleDeliveryUpdate]);

  useEffect(() => {
    loadData();
    // Keep polling as backup but with longer interval (60 seconds)
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch available partners with location
      const partnersResponse = await getAvailablePartnersForAssignment({ includeAll: true });
      
      console.log('📡 Partners API Response:', partnersResponse);
      
      if (partnersResponse.success) {
        // Transform partners to include location data
        // API returns partnerId, not id - also include partners without location
        const partnersWithLocation: PartnerLocation[] = partnersResponse.data
          .map(p => ({
            partnerId: p.partnerId || p.id, // Handle both cases
            name: p.name || 'Unknown',
            phone: p.phone || '',
            vehicleType: p.vehicleType || 'bike',
            vehicleNumber: p.vehicleNumber || '',
            latitude: p.currentLatitude || 0,
            longitude: p.currentLongitude || 0,
            isOnline: p.isOnline || false,
            averageRating: p.averageRating || 0,
            timestamp: p.lastLocationUpdate ? new Date(p.lastLocationUpdate) : new Date(),
          }));
        
        console.log('📍 Mapped partners:', partnersWithLocation);
        setPartners(partnersWithLocation);
      }

      // Fetch active deliveries (shipped orders)
      const deliveriesResponse = await getInTransitOrders();

      console.log('🚚 In-transit orders:', deliveriesResponse);

      if (deliveriesResponse.success) {
        const deliveries: ActiveDelivery[] = deliveriesResponse.data.map((d: any) => ({
          orderNumber: d.orderNumber,
          customerName: d.customerName,
          customerPhone: d.customerPhone || '',
          address: `${d.deliveryAddress?.addressLine1 || ''}, ${d.deliveryAddress?.city || ''}`,
          status: d.orderStatus,
          estimatedTime: d.estimatedDeliveryTime,
          deliveryPartnerId: d.deliveryPartnerId,
        }));
        setActiveDeliveries(deliveries);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading tracking data:", error);
      toast.error("Failed to load tracking data");
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'bike':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'van':
        return '🚐';
      case 'scooter':
        return '🛵';
      default:
        return '🚙';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchPartner.toLowerCase()) ||
      p.vehicleNumber.toLowerCase().includes(searchPartner.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'online' && p.isOnline) ||
      (filterStatus === 'offline' && !p.isOnline);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            Live Delivery Tracking
          </h1>
          <p className="text-muted-foreground">
            Real-time location tracking of delivery partners
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Offline</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partners.length}</p>
                <p className="text-sm text-muted-foreground">Active Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partners.filter(p => p.isOnline).length}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDeliveries.length}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activeDeliveries.filter(d => d.status === 'shipped').length}
                </p>
                <p className="text-sm text-muted-foreground">Out for Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Partner Locations
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  {partners.filter(p => p.isOnline).length} Online
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                  {partners.filter(p => !p.isOnline).length} Offline
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {partners.length > 0 && partners.some(p => p.latitude && p.longitude) ? (
              <DeliveryMap 
                partners={partners}
                activeDeliveries={activeDeliveries}
                selectedPartner={selectedPartner}
                onPartnerSelect={(partner) => setSelectedPartner(partner)}
              />
            ) : (
              <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No partner locations available</p>
                  <p className="text-sm text-gray-400">Partners will appear here when they go online</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partners List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Delivery Partners</CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Search partners..."
                value={searchPartner}
                onChange={(e) => setSearchPartner(e.target.value)}
                className="h-8"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {isLoading && partners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading partners...
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No partners found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.partnerId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPartner?.partnerId === partner.partnerId
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getVehicleIcon(partner.vehicleType)}</span>
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {partner.vehicleNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{partner.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={partner.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}
                      >
                        {partner.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {partner.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map / Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedPartner ? `${selectedPartner.name}'s Details` : 'Select a Partner'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPartner ? (
              <div className="space-y-4">
                {/* Partner Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedPartner.phone}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-muted-foreground">Vehicle</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {selectedPartner.vehicleType} - {selectedPartner.vehicleNumber}
                    </p>
                  </div>
                </div>

                {/* Current Location */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-blue-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Location
                  </Label>
                  <p className="font-mono text-sm mt-1">
                    {selectedPartner.latitude.toFixed(6)}, {selectedPartner.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {selectedPartner.timestamp.toLocaleString()}
                  </p>
                </div>

                {/* Active Deliveries for this Partner */}
                <div>
                  <h3 className="font-medium mb-2">Active Deliveries</h3>
                  {activeDeliveries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active deliveries</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeDeliveries.slice(0, 5).map((delivery) => (
                          <TableRow key={delivery.orderNumber}>
                            <TableCell className="font-medium">{delivery.orderNumber}</TableCell>
                            <TableCell>
                              <p>{delivery.customerName}</p>
                              <p className="text-xs text-muted-foreground">{delivery.customerPhone}</p>
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {delivery.address}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(delivery.status)}>
                                {delivery.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Navigation className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a delivery partner to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
