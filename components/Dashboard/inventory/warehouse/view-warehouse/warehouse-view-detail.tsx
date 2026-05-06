"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, User, Phone } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: string;
  manager: string;
  phone: string;
  createdAt?: string;
}

interface WarehouseViewDetailProps {
  warehouse: Warehouse;
}

export default function WarehouseViewDetail({
  warehouse,
}: WarehouseViewDetailProps) {
  return (
    <div className="bg-muted/30 border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">{warehouse.name}</h2>
        </div>
        <Badge
          variant={warehouse.status === "active" ? "default" : "secondary"}
        >
          {warehouse.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="font-medium">
              {warehouse.address}, {warehouse.city}, {warehouse.state} - {warehouse.postalCode}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{warehouse.country}</p>
          </div>
        </div>

        {/* Manager */}
        <div className="flex items-start gap-2">
          <User className="size-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Manager</p>
            <p className="font-medium">{warehouse.manager}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-start gap-2">
          <Phone className="size-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="font-medium">{warehouse.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
