"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import AddItemModal, { ItemFormData } from "./add-item-modal";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

interface AddItemButtonProps {
  onItemAdded?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function AddItemButton({
  onItemAdded,
  className,
  children = "Add Items",
}: AddItemButtonProps) {
  const { canAdd } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (itemData: ItemFormData) => {
    setIsSubmitting(true);
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      formData.append("itemName", itemData.itemName);
      formData.append("category", itemData.category);
      formData.append("itemCode", itemData.itemCode || "");
      formData.append("uom", itemData.uom);
      formData.append("purchasePrice", itemData.purchasePrice);
      formData.append("gstRateId", itemData.gstRateId);
      formData.append("gstPercentage", itemData.gstPercentage);
      formData.append("hsnCode", itemData.hsnCode || "");
      formData.append("warehouse", itemData.warehouse);
      formData.append("openingStock", itemData.openingStock);
      formData.append("lowStockAlertLevel", itemData.lowStockAlertLevel);
      formData.append("status", itemData.status);
      formData.append("description", itemData.description || "");
      
      // 🆕 Add processing fields (as strings, backend will parse)
      formData.append("itemType", itemData.itemType);
      formData.append("requiresProcessing", itemData.requiresProcessing ? "true" : "false");
      
      // 🆕 Add multi-UOM fields
      formData.append("baseUom", itemData.baseUom || itemData.uom);
      if (itemData.selectedUoms && itemData.selectedUoms.length > 0) {
        formData.append("selectedUoms", JSON.stringify(itemData.selectedUoms));
      } else {
        formData.append("selectedUoms", JSON.stringify([itemData.baseUom || itemData.uom]));
      }
      
      if (itemData.expiryDate) {
        formData.append("expiryDate", itemData.expiryDate.toISOString());
      }
      
      // Only append image if it's a File object (new upload)
      if (itemData.itemImage && itemData.itemImage instanceof File) {
        formData.append("itemImage", itemData.itemImage);
      }

      const response = await axiosInstance.post("/api/inventory/items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Item added successfully!");
        setIsModalOpen(false);
        
        // Call the parent's callback if provided
        if (onItemAdded) {
          onItemAdded();
        }
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to add item";
      
      toast.error("Error Adding Item", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAdd("warehouse")) return null;

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={className}
        size="sm"
      >
        {children}
      </Button>

      <AddItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
