"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductFormState } from "@/types/product";
import { ShieldCheck, Info, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ComplianceTabProps {
  formData: ProductFormState;
  onChange: (field: keyof ProductFormState, value: any) => void;
}

export function ComplianceTab({ formData, onChange }: ComplianceTabProps) {
  // Convert string dates to Date objects for the calendar
  const mfgDateObj = formData.mfgDate ? new Date(formData.mfgDate) : undefined;
  const expiryDateObj = formData.expiryDate ? new Date(formData.expiryDate) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-green-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold">Compliance Information</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Optional compliance details for regulated products (FMCG, Food, etc.)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-900">
            These fields are optional but recommended for food products, FMCG items, and other regulated goods.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manufacturing Date */}
        <div>
          <Label htmlFor="mfgDate">Manufacturing Date (MFG Date)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !mfgDateObj && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {mfgDateObj ? (
                  format(mfgDateObj, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={mfgDateObj}
                onSelect={(date) => {
                  // Convert Date to ISO string for storage
                  onChange("mfgDate", date ? date.toISOString().split('T')[0] : undefined);
                }}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-1">
            Date when the product was manufactured
          </p>
        </div>

        {/* Expiry Date */}
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !expiryDateObj && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiryDateObj ? (
                  format(expiryDateObj, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiryDateObj}
                onSelect={(date) => {
                  // Convert Date to ISO string for storage
                  onChange("expiryDate", date ? date.toISOString().split('T')[0] : undefined);
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-1">
            Best before or expiry date for perishable items
          </p>
        </div>

        {/* Batch Number */}
        <div>
          <Label htmlFor="batchNo">Batch Number</Label>
          <Input
            id="batchNo"
            value={formData.batchNo || ""}
            onChange={(e) => onChange("batchNo", e.target.value || undefined)}
            placeholder="Enter batch number"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Manufacturing batch or lot number for traceability
          </p>
        </div>
      </div>

      {/* Safety Information */}
      <div>
        <Label htmlFor="safetyInformation">Safety Information</Label>
        <Textarea
          id="safetyInformation"
          value={formData.safetyInformation || ""}
          onChange={(e) => onChange("safetyInformation", e.target.value || undefined)}
          placeholder="Enter safety warnings, usage instructions, or precautions"
          className="mt-2 min-h-[120px]"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Include any safety warnings, allergen information, usage instructions, or precautions
        </p>
      </div>

      {/* Compliance Summary */}
      {(formData.mfgDate || formData.expiryDate || formData.batchNo || formData.safetyInformation) && (
        <div className="border-t pt-6">
          <h4 className="text-base font-semibold mb-4">Compliance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.mfgDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Manufacturing Date</p>
                <p className="text-base font-medium mt-1">
                  {new Date(formData.mfgDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {formData.expiryDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="text-base font-medium mt-1">
                  {new Date(formData.expiryDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {formData.batchNo && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Batch Number</p>
                <p className="text-base font-medium mt-1">{formData.batchNo}</p>
              </div>
            )}
            {formData.safetyInformation && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg md:col-span-2">
                <p className="text-sm text-muted-foreground">Safety Information</p>
                <p className="text-sm mt-1 line-clamp-3 text-gray-700">{formData.safetyInformation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {formData.expiryDate && new Date(formData.expiryDate) < new Date() && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Product Expired</p>
            <p className="text-sm text-red-700 mt-1">
              The expiry date has passed. This product should not be sold.
            </p>
          </div>
        </div>
      )}

      {formData.expiryDate && 
       new Date(formData.expiryDate) > new Date() && 
       new Date(formData.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
        <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-orange-900">Expiring Soon</p>
            <p className="text-sm text-orange-700 mt-1">
              This product will expire within 30 days. Consider offering a discount or removing from sale.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
