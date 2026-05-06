"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormState } from "@/types/product";
import { AlertCircle, Package } from "lucide-react";

interface InventoryTabProps {
  formData: ProductFormState;
  onChange: (field: keyof ProductFormState, value: unknown) => void;
}

export function InventoryTab({ formData, onChange }: InventoryTabProps) {
  const getStockStatusColor = () => {
    if (formData.stockStatus === "out-of-stock") return "text-red-600";
    if (formData.totalStockQuantity <= formData.lowStockAlertLevel) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Inventory Management</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage stock levels and inventory alerts for all product variants
        </p>
      </div>

      {/* Variants Stock Summary */}
      {formData.enableVariants && formData.variants.length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-start gap-2 mb-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Variant Stock Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                Total stock is calculated from all variants
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {formData.variants.map((variant) => (
              <div key={variant.id} className="bg-white p-3 rounded border">
                <p className="text-xs text-muted-foreground truncate">{variant.variantName}</p>
                <p className="text-lg font-semibold">{variant.variantStockQuantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Stock Quantity */}
        <div>
          <Label htmlFor="totalStockQuantity">
            Total Stock Quantity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="totalStockQuantity"
            type="number"
            min="0"
            value={formData.totalStockQuantity}
            onChange={(e) => onChange("totalStockQuantity", parseInt(e.target.value) || 0)}
            placeholder="Enter total stock"
            className="mt-2"
            disabled={formData.enableVariants && formData.variants.length > 0}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.enableVariants && formData.variants.length > 0
              ? "Auto-calculated from variants"
              : "Total available quantity across all variants"}
          </p>
        </div>

        {/* Low Stock Alert Level */}
        <div>
          <Label htmlFor="lowStockAlertLevel">Low Stock Alert Level</Label>
          <Input
            id="lowStockAlertLevel"
            type="number"
            min="0"
            value={formData.lowStockAlertLevel}
            onChange={(e) => onChange("lowStockAlertLevel", parseInt(e.target.value) || 0)}
            placeholder="Auto-filled from inventory"
            className="mt-2"
            readOnly
            disabled
          />
          <p className="text-sm text-muted-foreground mt-1">
            Auto-filled from inventory product (read-only)
          </p>
        </div>

        {/* Stock Status */}
        <div>
          <Label htmlFor="stockStatus">
            Stock Status <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.stockStatus}
            onValueChange={(value: "in-stock" | "out-of-stock") =>
              onChange("stockStatus", value)
            }
          >
            <SelectTrigger id="stockStatus" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stock Status Alert */}
      {formData.totalStockQuantity <= formData.lowStockAlertLevel && formData.totalStockQuantity > 0 && (
        <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-orange-900">Low Stock Alert</p>
            <p className="text-sm text-orange-700 mt-1">
              Current stock ({formData.totalStockQuantity}) is at or below the alert level ({formData.lowStockAlertLevel}).
              Consider restocking soon.
            </p>
          </div>
        </div>
      )}

      {formData.stockStatus === "out-of-stock" && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Out of Stock</p>
            <p className="text-sm text-red-700 mt-1">
              This product is marked as out of stock and won&apos;t be available for purchase on the website.
            </p>
          </div>
        </div>
      )}

      {/* Inventory Summary Card */}
      <div className="border-t pt-6">
        <h4 className="text-base font-semibold mb-4">Inventory Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className={`text-2xl font-bold ${getStockStatusColor()}`}>
              {formData.totalStockQuantity}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Alert Level</p>
            <p className="text-2xl font-bold text-orange-600">
              {formData.lowStockAlertLevel}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`text-lg font-bold ${getStockStatusColor()}`}>
              {formData.stockStatus === "in-stock" ? "In Stock" : "Out of Stock"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
