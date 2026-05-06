"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { DeliveryChargeRule } from "./delivery-charge-settings";
import { useCurrency } from "@/hooks/useCurrency";


interface DeliveryChargeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<DeliveryChargeRule, "id" | "createdAt" | "updatedAt">) => void;
  editingRule: DeliveryChargeRule | null;
}

export const DeliveryChargeForm = ({
  open,
  onClose,
  onSave,
  editingRule,
}: DeliveryChargeFormProps) => {
  const currencySymbol = useCurrency();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    minOrderValue: 0,
    chargeAmount: 0,
    isActive: true,
  });

  useEffect(() => {
    if (editingRule) {
      setFormData({
        minOrderValue: editingRule.minOrderValue,
        chargeAmount: editingRule.chargeAmount,
        isActive: editingRule.isActive,
      });
    } else {
      setFormData({
        minOrderValue: 0,
        chargeAmount: 0,
        isActive: true,
      });
    }
  }, [editingRule, open]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.minOrderValue < 0) {
      toast.error("Minimum order value cannot be negative");
      return;
    }

    if (formData.chargeAmount < 0) {
      toast.error("Charge amount cannot be negative");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const saveData = {
        minOrderValue: formData.minOrderValue,
        chargeAmount: formData.chargeAmount,
        isActive: formData.isActive,
      };

      onSave(saveData);
    } catch (error) {
      toast.error("Failed to save delivery charge rule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Edit Delivery Charge Rule" : "Add Delivery Charge Rule"}
          </DialogTitle>
          <DialogDescription>
            Set the minimum order value for free delivery and the charge for orders below that threshold
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Free Delivery Threshold */}
          <div className="space-y-2">
            <Label htmlFor="minOrderValue">
              Free Delivery Threshold <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="minOrderValue"
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) =>
                  handleChange("minOrderValue", parseFloat(e.target.value) || 0)
                }
                className="pl-8"
                placeholder="500"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Orders at or above this amount get free delivery
            </p>
          </div>

          <Separator />

          {/* Delivery Charge (Below Threshold) */}
          <div className="space-y-2">
            <Label htmlFor="chargeAmount">
              Delivery Charge (Below Threshold) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="chargeAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.chargeAmount}
                onChange={(e) =>
                  handleChange("chargeAmount", parseFloat(e.target.value) || 0)
                }
                className="pl-8"
                placeholder="40"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.chargeAmount === 0
                ? "Set to 0 for free delivery on all orders"
                : `Orders below ${currencySymbol}${formData.minOrderValue} will be charged ${currencySymbol}${formData.chargeAmount}`}
            </p>
          </div>

          <Separator />

          {/* Example Preview */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              How it works:
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Orders ≥ {currencySymbol}{formData.minOrderValue}: <span className="font-semibold text-green-600">FREE delivery</span></p>
              <p>• Orders &lt; {currencySymbol}{formData.minOrderValue}: <span className="font-semibold">{currencySymbol}{formData.chargeAmount} delivery charge</span></p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Note: Individual product shipping charges will be ignored when this rule is active
              </p>
            </div>
          </div>

          <Separator />

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable this rule to apply it to all orders
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editingRule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
