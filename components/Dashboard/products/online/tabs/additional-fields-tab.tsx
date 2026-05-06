"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProductFormState } from "@/types/product";
import { FileText, Globe } from "lucide-react";

interface AdditionalFieldsTabProps {
  formData: ProductFormState;
  onChange: (field: keyof ProductFormState, value: any) => void;
}

export function AdditionalFieldsTab({ formData, onChange }: AdditionalFieldsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Product Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add extra details about returns, warranty, and product origin
        </p>
      </div>

      {/* Return Policy */}
      <div className="border rounded-lg p-4">
        <div className="flex items-start gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="returnPolicyApplicable" className="text-base font-medium">
                  Return Policy Applicable
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow customers to return this product
                </p>
              </div>
              <Switch
                id="returnPolicyApplicable"
                checked={formData.returnPolicyApplicable}
                onCheckedChange={(checked) => onChange("returnPolicyApplicable", checked)}
              />
            </div>
          </div>
        </div>

        {formData.returnPolicyApplicable && (
          <div className="mt-4">
            <Label htmlFor="returnWindowDays">Return Window (Days)</Label>
            <Input
              id="returnWindowDays"
              type="number"
              min="0"
              value={formData.returnWindowDays}
              onChange={(e) => onChange("returnWindowDays", parseInt(e.target.value) || 0)}
              placeholder="Enter number of days"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Number of days customers have to return the product after delivery
            </p>
          </div>
        )}
      </div>

      {/* Warranty Details */}
      <div>
        <Label htmlFor="warrantyDetails">Warranty Details</Label>
        <Textarea
          id="warrantyDetails"
          value={formData.warrantyDetails || ""}
          onChange={(e) => onChange("warrantyDetails", e.target.value)}
          placeholder="Enter warranty information (e.g., 1 year manufacturer warranty, 6 months replacement guarantee)"
          className="mt-2 min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Describe the warranty coverage, duration, and terms
        </p>
      </div>

      {/* Country of Origin */}
      <div className="border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-green-600 mt-1" />
          <div className="flex-1">
            <Label htmlFor="countryOfOrigin" className="text-base font-medium">
              Country of Origin <span className="text-red-500">*</span>
            </Label>
            <Input
              id="countryOfOrigin"
              value={formData.countryOfOrigin}
              onChange={(e) => onChange("countryOfOrigin", e.target.value)}
              placeholder="Enter country name"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Country where the product is manufactured or assembled
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border-t pt-6">
        <h4 className="text-base font-semibold mb-4">Additional Information Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Return Policy</p>
            <p className="text-base font-medium mt-1">
              {formData.returnPolicyApplicable
                ? `${formData.returnWindowDays} days return window`
                : "Not applicable"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Country of Origin</p>
            <p className="text-base font-medium mt-1">{formData.countryOfOrigin}</p>
          </div>
          {formData.warrantyDetails && (
            <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
              <p className="text-sm text-muted-foreground">Warranty</p>
              <p className="text-sm mt-1 line-clamp-2">{formData.warrantyDetails}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Benefits Preview */}
      <div className="border-t pt-6">
        <h4 className="text-base font-semibold mb-4">Customer Benefits Preview</h4>
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm font-medium text-blue-900 mb-3">
            This is how customers will see the benefits:
          </p>
          <div className="space-y-2">
            {formData.returnPolicyApplicable && (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{formData.returnWindowDays} days easy return policy</span>
              </div>
            )}
            {formData.warrantyDetails && (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Warranty included</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Made in {formData.countryOfOrigin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
