"use client";

import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";

interface PartnerLocation {
  partnerId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
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
  deliveryPartnerId?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

interface DeliveryMapProps {
  partners: PartnerLocation[];
  activeDeliveries?: ActiveDelivery[];
  selectedPartner: PartnerLocation | null;
  onPartnerSelect: (partner: PartnerLocation) => void;
}

function DeliveryMapContent({ partners, activeDeliveries = [], selectedPartner, onPartnerSelect }: DeliveryMapProps) {
  const [Leaflet, setLeaflet] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    import("react-leaflet").then((mod) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      setLeaflet({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Marker: mod.Marker,
        Popup: mod.Popup,
      });
    });
  }, []);

  const center = useMemo(() => {
    if (selectedPartner && selectedPartner.latitude && selectedPartner.longitude) {
      return [selectedPartner.latitude, selectedPartner.longitude] as [number, number];
    }
    const partnerWithLocation = partners.find((p) => p.latitude && p.longitude);
    if (partnerWithLocation) {
      return [partnerWithLocation.latitude, partnerWithLocation.longitude] as [number, number];
    }
    return [11.0168, 76.9558] as [number, number];
  }, [selectedPartner, partners]);

  const onlineCount = partners.filter((p) => p.isOnline).length;
  const offlineCount = partners.length - onlineCount;

  const getMarkerIcon = (partner: PartnerLocation) => {
    const isSelected = selectedPartner?.partnerId === partner.partnerId;
    const color = isSelected ? "#2563eb" : partner.isOnline ? "#10b981" : "#6b7288";

    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
        ">${partner.name.substring(0, 2).toUpperCase()}</div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  if (!Leaflet || !isClient) {
    return (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = Leaflet;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css"
      />
      <div className="h-[500px] w-full rounded-lg overflow-hidden relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {partners
            .filter((p) => p.latitude && p.longitude)
            .map((partner) => (
              <Marker
                key={partner.partnerId}
                position={[partner.latitude, partner.longitude]}
                icon={getMarkerIcon(partner)}
                eventHandlers={{
                  click: () => onPartnerSelect(partner),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <p className="font-bold">{partner.name}</p>
                    <p className="text-sm">{partner.vehicleType} - {partner.vehicleNumber}</p>
                    <p className="text-sm">{partner.isOnline ? "🟢 Online" : "⚫ Offline"}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-sm font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm">{onlineCount} Online</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-sm">{offlineCount} Offline</span>
          </div>
          {activeDeliveries.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm">{activeDeliveries.length} Deliveries</span>
            </div>
          )}
        </div>

        {/* Selected Partner Info */}
        {selectedPartner && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{selectedPartner.name}</span>
              <Badge variant="outline" className={selectedPartner.isOnline ? "bg-green-50" : "bg-gray-50"}>
                {selectedPartner.isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>{selectedPartner.vehicleType} - {selectedPartner.vehicleNumber}</p>
              <p className="font-mono">{selectedPartner.latitude.toFixed(4)}, {selectedPartner.longitude.toFixed(4)}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function DeliveryMap(props: DeliveryMapProps) {
  return <DeliveryMapContent {...props} />;
}
