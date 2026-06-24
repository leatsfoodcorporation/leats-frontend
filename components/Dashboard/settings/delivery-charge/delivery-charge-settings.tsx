"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Truck, DollarSign, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { DeliveryChargeForm } from "./delivery-charge-form";
import {
  getAllDeliveryCharges,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
  type DeliveryChargeRule,
} from "@/services/deliveryChargeService";

export type { DeliveryChargeRule };

export const DeliveryChargeSettings = () => {
  const currencySymbol = useCurrency();
  const { canAdd, canEdit, canDelete } = usePermissions();
  const [rules, setRules] = useState<DeliveryChargeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryChargeRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Fetch delivery charges on mount
  useEffect(() => {
    fetchDeliveryCharges();
  }, []);

  const fetchDeliveryCharges = async () => {
    try {
      setIsLoading(true);
      const data = await getAllDeliveryCharges();
      setRules(data);
    } catch (error) {
      console.error("Error fetching delivery charges:", error);
      toast.error("Failed to fetch delivery charge settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rule: DeliveryChargeRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRule(null);
  };

  const handleSave = async (data: Omit<DeliveryChargeRule, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingRule) {
        // Update existing rule
        await updateDeliveryCharge(editingRule.id, data);
        toast.success("Delivery charge rule updated successfully");
      } else {
        // Create new rule
        await createDeliveryCharge(data);
        toast.success("Delivery charge rule created successfully");
      }
      handleCloseForm();
      fetchDeliveryCharges();
    } catch (error: unknown) {
      console.error("Error saving delivery charge:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Failed to save delivery charge rule";
      toast.error(errorMessage || "Failed to save delivery charge rule");
    }
  };

  const handleToggleActive = async (rule: DeliveryChargeRule) => {
    try {
      await updateDeliveryCharge(rule.id, { isActive: !rule.isActive });
      toast.success(`Delivery rule ${rule.isActive ? "deactivated" : "activated"}`);
      fetchDeliveryCharges();
    } catch (error) {
      console.error("Error toggling delivery charge:", error);
      toast.error("Failed to update delivery charge status");
    }
  };

  const handleDelete = async () => {
    if (!deleteRuleId) return;
    
    try {
      await deleteDeliveryCharge(deleteRuleId);
      toast.success("Delivery charge rule deleted");
      setDeleteRuleId(null);
      fetchDeliveryCharges();
    } catch (error) {
      console.error("Error deleting delivery charge:", error);
      toast.error("Failed to delete delivery charge rule");
    }
  };

  const formatOrderRange = (min: number) => {
    return `${currencySymbol}${min}+`;
  };

  const formatCharge = (amount: number) => {
    if (amount === 0) {
      return "FREE";
    }
    return `${currencySymbol}${amount}`;
  };

  // Sort rules by minOrderValue ascending
  const sortedRules = [...rules].sort((a, b) => a.minOrderValue - b.minOrderValue);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Delivery Charge Rules
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure delivery charges based on order value ranges {rules.length >= 1 ? "(Currently limited to 1 rule)" : "(Multiple rules allowed)"}
          </p>
        </div>
        {canAdd("settings_charge") && <Button 
          onClick={handleOpenNew} 
          className="gap-2"
          disabled={rules.length >= 1}
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>}
      </div>

      <Separator />

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Delivery Charge Rules
          </CardTitle>
          <CardDescription>
            Currently limited to 1 delivery charge rule. Multiple rules support coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Delivery Rules</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first delivery charge rule to get started
              </p>
              {canAdd("settings_charge") && <Button onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Rule
              </Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Free Delivery Threshold</TableHead>
                  <TableHead>Charge (Below Threshold)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule) => (
                  <TableRow key={rule.id} className={!rule.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm font-semibold">
                      {formatOrderRange(rule.minOrderValue)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          rule.chargeAmount === 0
                            ? "font-bold text-green-600"
                            : "font-semibold"
                        }
                      >
                        {formatCharge(rule.chargeAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        disabled={!canEdit("settings_charge")}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit("settings_charge") && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>}
                        {canDelete("settings_charge") && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRuleId(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Form Dialog */}
      <DeliveryChargeForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        editingRule={editingRule}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteRuleId}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this delivery charge rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
