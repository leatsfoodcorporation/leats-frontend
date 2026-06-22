"use client";

import React, { useState, useEffect } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { PosProductFormData } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Barcode as BarcodeIcon, Download, Printer, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axios";
import { barcodeService } from "@/services/offline-services/barcodeService";
import Barcode from "react-barcode";
import { POPULAR_UOMS } from "@/lib/uom-constants";

interface PosProductEditProps {
  productId: string;
}

export const PosProductEdit: React.FC<PosProductEditProps> = ({
  productId,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PosProductFormData, string>>
  >({});
  const [categories, setCategories] = useState<string[]>([]);
  const [gstRates, setGstRates] = useState<Array<{ id: string; name: string; gstPercentage: number }>>([]);

  const [formData, setFormData] = useState<PosProductFormData>({
    itemName: "",
    category: "",
    itemCode: "",
    barcode: "",
    brand: "",
    uom: "",
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    gstPercentage: 0,
    hsnCode: "",
    discountType: "",
    discountValue: 0,
    warehouse: "Default",
    openingStock: 0,
    quantity: 0,
    lowStockAlertLevel: 0,
    status: "in_stock",
    display: "inactive",
    expiryDate: undefined,
    mfgDate: undefined,
    batchNo: "",
    safetyInformation: "",
    description: "",
    itemImage: "" as string | File,
  });

  // UOM Variants state
  const [uomVariants, setUomVariants] = useState<Array<{
    uom: string;
    value: number;
    price: number;
    name: string;
    barcode?: string;
  }>>([]);

  const [uomVariantErrors, setUomVariantErrors] = useState<Array<Record<string, string>>>([]);


  const [inventoryUoms, setInventoryUoms] = useState<string[]>([]);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [fetchingInventory, setFetchingInventory] = useState(false);


  useEffect(() => {
    fetchCategories();
    fetchGSTRates();
    fetchProduct();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/inventory/categories?isActive=true"
      );
      if (response.data.success) {
        const categoryNames = response.data.data.map(
          (cat: { name: string }) => cat.name
        );
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchGSTRates = async () => {
    try {
      const response = await axiosInstance.get("/api/finance/gst-rates?isActive=true");
      if (response.data.success) {
        setGstRates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching GST rates:", error);
      setGstRates([]);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/pos/products/${productId}`
      );

      if (response.data.success) {
        const product = response.data.data;
        setFormData({
          itemName: product.itemName,
          category: product.category,
          itemCode: product.itemCode || "",
          barcode: product.barcode || "",
          brand: product.brand || "",
          uom: product.uom,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice || 0,
          mrp: product.mrp || 0,
          gstPercentage: product.gstPercentage,
          hsnCode: product.hsnCode || "",
          discountType: product.discountType || "",
          discountValue: product.discountValue || 0,
          warehouse: product.warehouse,
          openingStock: product.openingStock,
          quantity: product.quantity,
          lowStockAlertLevel: product.lowStockAlertLevel,
          status: product.status,
          display: product.display || "inactive",
          expiryDate: product.expiryDate
            ? new Date(product.expiryDate)
            : undefined,
          mfgDate: product.mfgDate
            ? new Date(product.mfgDate)
            : undefined,
          batchNo: product.batchNo || "",
          safetyInformation: product.safetyInformation || "",
          description: product.description || "",
          itemImage: product.itemImage || "",
        });

        // Load available inventory UOMs
        setInventoryUoms(product.availableUoms || []);

        // Load UOM variants if they exist
        if (product.uomVariants && Array.isArray(product.uomVariants)) {
          setUomVariants(product.uomVariants.map((v: any) => ({
            ...v,
            name: v.name || `${v.value}${v.uom}`
          })));
        } else if (product.availableUoms && Array.isArray(product.availableUoms)) {

          // Fallback: create empty variants for available UOMs if no variants saved yet
          setUomVariants(product.availableUoms.map((uom: string) => ({
            uom: uom.toLowerCase(),
            value: 1,
            price: product.sellingPrice || 0,
            name: `${uom}`
          })));
        }


        // Fetch latest inventory data for validation
        if (product.itemId) {
          fetchInventoryItem(product.itemId);
        }
      }
    } catch (error) {
      toast.error("Failed to load product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItem = async (itemId: string) => {
    try {
      setFetchingInventory(true);
      const response = await axiosInstance.get(`/api/inventory/items/${itemId}`);
      if (response.data.success) {
        setInventoryItem(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory item:", error);
    } finally {
      setFetchingInventory(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PosProductFormData, string>> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required" as any;
    }
    if (!formData.category) {
      newErrors.category = "Category is required" as any;
    }
    if (!formData.uom) {
      newErrors.uom = "Unit of measurement is required" as any;
    }
    if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
      newErrors.gstPercentage = "GST % must be between 0 and 100" as any;
    }

    setErrors(newErrors);

    // Validate UOM Variants
    const newVariantErrors: Array<Record<string, string>> = [];
    let isVariantValid = true;

    uomVariants.forEach((variant, index) => {
      const rowErrors: Record<string, string> = {};
      if (!variant.name.trim()) {
        rowErrors.name = "Required";
        isVariantValid = false;
      }
      if (!variant.uom) {
        rowErrors.uom = "Required";
        isVariantValid = false;
      }
      if (!variant.value || variant.value <= 0) {
        rowErrors.value = "Required";
        isVariantValid = false;
      }
      if (variant.price === undefined || variant.price === null || variant.price < 0) {
        rowErrors.price = "Required";
        isVariantValid = false;
      }
      newVariantErrors[index] = rowErrors;
    });

    setUomVariantErrors(newVariantErrors);
    return Object.keys(newErrors).length === 0 && isVariantValid;
  };

  const performDataConsistencyCheck = () => {
    const warnings: string[] = [];
    
    if (!inventoryItem) return warnings;

    // 1. Stock Check
    if (Math.abs(formData.quantity - inventoryItem.quantity) > 0.001) {
      warnings.push(`Stock mismatch: POS is ${Number(formData.quantity.toFixed(3))}, Inventory is ${Number(inventoryItem.quantity.toFixed(3))}`);
    }

    // Base UOM Check
    if (formData.uom.toLowerCase() !== inventoryItem.baseUom.toLowerCase()) {
      warnings.push(`UOM mismatch: POS is ${formData.uom}, Inventory Base is ${inventoryItem.baseUom}`);
    }


    // 4. Variant Value Check
    if (uomVariants.length > 0) {
      const tooLargeVariants = uomVariants.filter(v => v.value > inventoryItem.quantity);
      if (tooLargeVariants.length > 0) {
        warnings.push(`Some UOM variants (like ${tooLargeVariants[0].uom}) define a quantity greater than available inventory stock.`);
      }
    }

    return warnings;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const warnings = performDataConsistencyCheck();
    if (warnings.length > 0) {
      // Show first warning and ask to proceed? 
      // For now, let's just show a toast warning but allow if it's not critical
      const criticalWarnings = warnings.filter(w => w.includes("Profit margin") || w.includes("UOM mismatch"));
      if (criticalWarnings.length > 0) {
        const proceed = window.confirm(`There are important discrepancies:\n\n${warnings.join('\n')}\n\nDo you still want to save?`);
        if (!proceed) return;
      } else {
        toast.info("Validation Note", {
          description: warnings[0],
        });
      }
    }


    try {
      setSaving(true);

      // Create FormData for multipart upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof PosProductFormData];
        if (value !== null && value !== undefined && value !== '') {
          if (value instanceof Date) {
            submitData.append(key, value.toISOString());
          } else if (value instanceof File) {
            submitData.append(key, value);
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      // Add UOM variants to submit data
      if (uomVariants.length > 0) {
        submitData.append('uomVariants', JSON.stringify(uomVariants));
        // Extract just the UOM names for availableUoms field (backward compatibility)
        const uomNames = Array.from(new Set(uomVariants.map(v => v.uom.toLowerCase())));
        submitData.append('availableUoms', JSON.stringify(uomNames));
      } else {
        submitData.append('uomVariants', JSON.stringify([]));
        submitData.append('availableUoms', JSON.stringify([]));
      }

      await axiosInstance.put(`/api/pos/products/${productId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success("Product updated successfully");
      router.push("/dashboard/pos/products");
    } catch (error: unknown) {
      const err = error as any;
      const errorMessage =
        err.response?.data?.error || err.message || "An error occurred";
      toast.error(`Failed to update product: ${errorMessage}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof PosProductFormData,
    value: string | number | Date | File | undefined
  ) => {
    setFormData((prev: PosProductFormData) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: Partial<Record<keyof PosProductFormData, string>>) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddUomVariant = () => {
    setUomVariants([...uomVariants, { name: '', uom: formData.uom.toLowerCase() || 'kg', value: 0, price: 0, barcode: '' }]);
  };


  const handleRemoveUomVariant = (index: number) => {
    setUomVariants(uomVariants.filter((_, i) => i !== index));
  };

  const handleUomVariantChange = (index: number, field: string, value: string | number) => {
    const updated = [...uomVariants];
    // For number fields, if empty string is passed, keep it as 0 but the UI will show placeholder
    const finalValue = (field === 'price' || field === 'value') && value === '' ? 0 : value;
    updated[index] = { ...updated[index], [field]: finalValue as any };
    setUomVariants(updated);
    
    // Clear error for this field
    if (uomVariantErrors[index]?.[field]) {
      const updatedErrors = [...uomVariantErrors];
      const newRowErrors = { ...updatedErrors[index] };
      delete newRowErrors[field];
      updatedErrors[index] = newRowErrors;
      setUomVariantErrors(updatedErrors);
    }
  };

  const [isGeneratingVariantBarcode, setIsGeneratingVariantBarcode] = useState<number | null>(null);

  const handleVariantBarcodeGenerate = async (index: number) => {
    try {
      setIsGeneratingVariantBarcode(index);
      const response = await barcodeService.generateBarcode();
      
      if (response.success) {
        handleUomVariantChange(index, 'barcode', response.data.barcode);
        toast.success(`Variant barcode generated: ${response.data.barcode}`);
      }
    } catch (error: unknown) {
      console.error("Error generating variant barcode:", error);
      toast.error("Failed to generate variant barcode");
    } finally {
      setIsGeneratingVariantBarcode(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-muted-foreground">Loading product...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update product information (synced from inventory)
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">1. Basic Information</h2>
          
          {/* Row: Category & Product Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger
                  className={cn(
                    "w-full",
                    errors.category && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="itemName"
                type="text"
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
                placeholder="Enter product name"
                className={cn(errors.itemName && "border-destructive")}
              />
              {errors.itemName && (
                <p className="text-xs text-destructive">{errors.itemName}</p>
              )}
            </div>
          </div>

          {/* Row: SKU & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemCode">Product SKU</Label>
              <Input
                id="itemCode"
                type="text"
                value={formData.itemCode}
                onChange={(e) => handleChange("itemCode", e.target.value)}
                placeholder="Enter SKU"
                disabled
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ SKU cannot be changed. Managed by inventory system.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Enter brand"
              />
            </div>
          </div>

          {/* Row: Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Product Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          {/* Row: Active/Inactive */}
          <div className="space-y-2">
            <Label htmlFor="display">Active / Inactive</Label>
            <Select
              value={formData.display}
              onValueChange={(value) => handleChange("display", value)}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section 2: Media */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">2. Media</h2>
          
          {/* Main Product Image */}
          <div className="space-y-2">
            <Label htmlFor="itemImage">Main Product Image</Label>
            {formData.itemImage && typeof formData.itemImage === 'string' && formData.itemImage.trim() !== '' && (
              <div className="mb-2 relative w-32 h-32">
                <NextImage
                  src={formData.itemImage}
                  alt="Product"
                  fill
                  sizes="128px"
                  className="object-cover rounded-lg border"
                  priority={false}
                  quality={75}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Product images are managed through the inventory service
            </p>
          </div>
        </div>

        {/* Section 3: Tax Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">3. Tax Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                type="text"
                value={formData.hsnCode}
                onChange={(e) => handleChange("hsnCode", e.target.value)}
                placeholder="Enter HSN code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstPercentage">
                GST % <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.gstPercentage.toString()}
                onValueChange={(value) => {
                  const gst = parseFloat(value);
                  handleChange("gstPercentage", gst);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full",
                    errors.gstPercentage && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select GST rate" />
                </SelectTrigger>
                <SelectContent>
                  {gstRates.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No GST rates available
                    </div>
                  ) : (
                    gstRates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.gstPercentage.toString()}>
                        {rate.name} ({rate.gstPercentage}%)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>


        {/* Section 4: Unit of Measure (UOM) Variants */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">4. Unit of Measure (UOM) Variants</h2>
          
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Base UOM</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <span className="font-medium">{formData.uom || 'Not set'}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  (Managed by inventory system)
                </span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
             
              <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 min-h-[46px] items-center">
                {inventoryUoms.length > 0 ? (
                  inventoryUoms.map((uom, idx) => (
                    <span key={idx} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-blue-200 dark:border-blue-800">
                      {uom}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic ml-2">No additional UOMs in inventory</span>
                )}
              </div>
            </div>
          </div>

          {/* UOM Variants List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>UOM Options & Pricing</Label>
                <p className="text-xs text-muted-foreground">
                  Define variants like 250g, 500g, 1kg with different prices.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddUomVariant}
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add UOM Option
              </Button>
            </div>

            {uomVariants.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center bg-muted/30">
                No UOM variants added. Click &quot;Add UOM Option&quot; to create variants.
              </div>
            ) : (
              <div className="space-y-3">
                {uomVariants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="col-span-12 md:col-span-2 space-y-1.5">
                      <Label className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        uomVariantErrors[index]?.name ? "text-destructive" : "text-muted-foreground"
                      )}>
                        Variant Name/Label
                      </Label>
                      <Input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUomVariantChange(index, 'name', e.target.value)}
                        placeholder="e.g., 500g Pack"
                        className={cn("h-10", uomVariantErrors[index]?.name && "border-destructive shake-animation")}
                        required
                      />
                    </div>


                    <div className="col-span-12 md:col-span-2 space-y-1.5">
                      <Label className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        uomVariantErrors[index]?.uom ? "text-destructive" : "text-muted-foreground"
                      )}>
                        UOM
                      </Label>
                      <Select
                        value={variant.uom}
                        onValueChange={(value) => handleUomVariantChange(index, 'uom', value)}
                        required
                      >
                        <SelectTrigger className={cn("h-10", uomVariantErrors[index]?.uom && "border-destructive")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryUoms.length > 0 ? (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold px-2 py-1.5 leading-none">Inventory UOMs</SelectLabel>
                              {inventoryUoms.map((uom) => (
                                <SelectItem key={uom} value={uom.toLowerCase()}>
                                  {uom}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ) : (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] uppercase text-muted-foreground font-bold px-2 py-1.5 leading-none">Units</SelectLabel>
                              {POPULAR_UOMS.map((uom) => (
                                <SelectItem key={uom} value={uom}>
                                  {uom.charAt(0).toUpperCase() + uom.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 md:col-span-1 space-y-1.5">
                      <Label className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        uomVariantErrors[index]?.value ? "text-destructive" : "text-muted-foreground"
                      )}>
                        Value
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.value || ''}
                        onChange={(e) => handleUomVariantChange(index, 'value', e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
                        className={cn("h-10 px-2", uomVariantErrors[index]?.value && "border-destructive")}
                        placeholder="1"
                        required
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        uomVariantErrors[index]?.price ? "text-destructive" : "text-muted-foreground"
                      )}>
                        Price (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price || ''}
                          onChange={(e) => handleUomVariantChange(index, 'price', e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
                          placeholder="0.00"
                          className={cn("h-10 pl-7", uomVariantErrors[index]?.price && "border-destructive")}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-10 md:col-span-4 space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Barcode</Label>
                      <div className="flex gap-1.5">
                        <Input
                          type="text"
                          value={variant.barcode || ''}
                          onChange={(e) => handleUomVariantChange(index, 'barcode', e.target.value)}
                          placeholder="Variant Barcode"
                          className="h-10 text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => handleVariantBarcodeGenerate(index)}
                          disabled={isGeneratingVariantBarcode === index}
                          title="Generate Barcode"
                        >
                          {isGeneratingVariantBarcode === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BarcodeIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>


                    <div className="col-span-2 md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUomVariant(index)}
                        className="h-10 w-full hover:bg-destructive/10 hover:text-destructive transition-colors group"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="md:hidden ml-2">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span className="mt-0.5">ℹ️</span>
                <span>
                  <strong>Tip:</strong> For &quot;Chicken Piece&quot;, add variants like <strong>250g</strong> (Value: 0.25, Uom: kg) or <strong>1 Box</strong> (Value: 1, Uom: piece).
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Inventory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold">5. Inventory</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inventoryItem?.id && fetchInventoryItem(inventoryItem.id)}
              disabled={fetchingInventory || !inventoryItem}
              className="text-xs h-7"
            >
              {fetchingInventory ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">🔄</span>
              )}
              Refresh Inventory Data
            </Button>
          </div>
          
          {/* Row: Stock Quantity, Low Stock Alert, Stock Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                POS Product Stock <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-1">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={typeof formData.quantity === 'number' ? Math.round(formData.quantity * 1000) / 1000 : formData.quantity}
                  placeholder="0"
                  disabled
                  className="bg-muted"
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-muted-foreground">
                    POS Snapshot
                  </p>
                  {inventoryItem && (
                    <p className={cn(
                      "text-[10px] font-medium",
                      Math.abs(formData.quantity - inventoryItem.quantity) > 0.001 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-green-600 dark:text-green-400"
                    )}>
                      Latest Inventory: {Number(inventoryItem.quantity.toFixed(3))} {inventoryItem.baseUom}
                    </p>
                  )}
                </div>
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="lowStockAlertLevel">
                Low Stock Alert Level <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lowStockAlertLevel"
                type="number"
                min="0"
                step="any"
                value={formData.lowStockAlertLevel}
                onChange={(e) =>
                  handleChange(
                    "lowStockAlertLevel",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
                className={cn(errors.lowStockAlertLevel && "border-destructive")}
              />
              {errors.lowStockAlertLevel && (
                <p className="text-xs text-destructive">
                  {errors.lowStockAlertLevel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Stock Status (In Stock / Out of Stock) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 5: Additional Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">5. Additional Information</h2>
          
          {/* Row: Expiry Date, MFG Date, Batch No */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (FMCG, Food products)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={
                  formData.expiryDate
                    ? formData.expiryDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleChange(
                    "expiryDate",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfgDate">MFG Date</Label>
              <Input
                id="mfgDate"
                type="date"
                value={
                  formData.mfgDate
                    ? formData.mfgDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleChange(
                    "mfgDate",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNo">Batch No</Label>
              <Input
                id="batchNo"
                type="text"
                value={formData.batchNo}
                onChange={(e) => handleChange("batchNo", e.target.value)}
                placeholder="Enter batch number"
              />
            </div>
          </div>

          {/* Row: Safety Information */}
          <div className="space-y-2">
            <Label htmlFor="safetyInformation">Safety Information</Label>
            <Textarea
              id="safetyInformation"
              value={formData.safetyInformation}
              onChange={(e) => handleChange("safetyInformation", e.target.value)}
              placeholder="Enter safety information, warnings, or precautions"
              rows={3}
            />
          </div>

          {/* Row: Product Image */}
          <div className="space-y-2">
            <Label htmlFor="itemImage">Product Image</Label>
            <div className="flex items-start gap-4">
              {/* Current Image Preview */}
              {formData.itemImage && (
                typeof formData.itemImage === 'string' 
                  ? formData.itemImage.trim() !== '' && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <NextImage
                          src={formData.itemImage}
                          alt="Product"
                          fill
                          sizes="128px"
                          className="object-cover"
                          priority={false}
                          quality={75}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )
                  : (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <NextImage
                          src={URL.createObjectURL(formData.itemImage)}
                          alt="Product"
                          fill
                          sizes="128px"
                          className="object-cover"
                          priority={false}
                          quality={75}
                        />
                      </div>
                    )
              )}
              
              {/* File Input */}
              <div className="flex-1">
                <Input
                  id="itemImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleChange("itemImage", file);
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload product image (JPEG, PNG, WebP - Max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
