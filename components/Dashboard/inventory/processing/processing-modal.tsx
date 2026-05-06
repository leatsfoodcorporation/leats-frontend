"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, AlertCircle, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { convertUOMValue, formatSmartUOMDisplay } from "@/lib/uom-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import AddItemButton from "../items/add-item-button";

interface ProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolItem: {
    id: string;
    itemId: string;
    itemName: string;
    category: string;
    currentStock: number;
    uom: string;
    availableUoms?: { uom: string; conversionFactor: number }[];
    avgPurchasePrice: number;
    warehouseId: string;
    warehouseName: string;
  };
  onSuccess: () => void;
}

interface PreviousRecipeItem {
  itemId: string;
  itemName: string;
  uom: string;
  currentStock: number;
  availableUoms?: { uom: string; conversionFactor: number }[];
  selected: boolean;
  newQuantity: string;
}

interface NewOutputItem {
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
  availableUoms?: { uom: string; conversionFactor: number }[];
}

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  uom: string;
  availableUoms: { uom: string; conversionFactor: number }[];
  itemType: string;
  quantity: number;
}

export default function ProcessingModal({
  open,
  onOpenChange,
  poolItem,
  onSuccess,
}: ProcessingModalProps) {
  const [inputQuantity, setInputQuantity] = useState("");
  const [inputUom, setInputUom] = useState(poolItem.uom);
  const [previousRecipeItems, setPreviousRecipeItems] = useState<PreviousRecipeItem[]>([]);
  const [newOutputs, setNewOutputs] = useState<NewOutputItem[]>([]);
  // Use explicit wastage quantity instead of percentage
  const [wastageQuantity, setWastageQuantity] = useState("");
  const [wastageUom, setWastageUom] = useState(poolItem.uom);
  const [processingCost, setProcessingCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [hasProcessedBefore, setHasProcessedBefore] = useState(false);
  // Validation state
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      
      let finishedItems: InventoryItem[] = [];
      
      try {
        setIsLoadingItems(true);
        setIsLoadingRecipe(true);

        const itemsResponse = await axiosInstance.get("/api/inventory/items");
        
        if (itemsResponse.data.success) {
          finishedItems = itemsResponse.data.data.filter(
            (item: InventoryItem) => 
              item.itemType === "regular" && 
              item.category === poolItem.category
          );
          setInventoryItems(finishedItems);
        }

        try {
          const recipeResponse = await axiosInstance.get(
            `/api/inventory/processing-pool/${poolItem.id}/recipe`
          );
          
          if (recipeResponse.data.success && recipeResponse.data.data.length > 0) {
            const recipeWithStock = recipeResponse.data.data.map((recipeItem: {
              itemId: string;
              itemName: string;
              uom: string;
              currentStock: number;
            }) => {
              const inventoryItem = finishedItems.find((item: InventoryItem) => item.id === recipeItem.itemId);
              return {
                itemId: recipeItem.itemId,
                itemName: recipeItem.itemName,
                uom: recipeItem.uom,
                availableUoms: inventoryItem?.availableUoms || [{ uom: recipeItem.uom, conversionFactor: 1 }],
                currentStock: inventoryItem?.quantity || 0,
                selected: false,
                newQuantity: "",
              };
            });
            setPreviousRecipeItems(recipeWithStock);
            setHasProcessedBefore(true);
          } else {
            setHasProcessedBefore(false);
          }
        } catch {
          setHasProcessedBefore(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load processing data");
      } finally {
        setIsLoadingItems(false);
        setIsLoadingRecipe(false);
      }
    };

    fetchData();
  }, [open, poolItem.category, poolItem.id]);

  useEffect(() => {
    if (!open) {
      setInputQuantity("");
      setPreviousRecipeItems([]);
      setNewOutputs([]);
      setWastageQuantity("");
      setWastageUom(poolItem.uom); // Reset to default logic handled in body
      setProcessingCost("0");
      setNotes("");
      setHasProcessedBefore(false);
      setInputError(null);
    }
  }, [open]);

  const togglePreviousItem = (index: number) => {
    setPreviousRecipeItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updatePreviousItemQuantity = (index: number, quantity: string) => {
    // Validate quantity is a valid number
    const qty = parseFloat(quantity);
    const validQuantity = isNaN(qty) || qty < 0 ? "" : quantity;
    
    setPreviousRecipeItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, newQuantity: validQuantity } : item
      )
    );
  };

  const addNewOutput = () => {
    setNewOutputs([
      ...newOutputs,
      { itemId: "", itemName: "", quantity: 0, uom: "", availableUoms: [] },
    ]);
  };

  const removeNewOutput = (index: number) => {
    setNewOutputs(newOutputs.filter((_, i) => i !== index));
  };

  const updateNewOutput = (index: number, field: keyof NewOutputItem, value: string | number) => {
    const newOutputsCopy = [...newOutputs];
    
    if (field === "itemId") {
      const selectedItem = inventoryItems.find((item) => item.id === value);
      if (selectedItem) {
        newOutputsCopy[index] = {
          ...newOutputsCopy[index],
          itemId: selectedItem.id,
          itemName: selectedItem.itemName,
          uom: selectedItem.availableUoms[0]?.uom || selectedItem.uom,
          availableUoms: selectedItem.availableUoms,
        };
      }
    } else if (field === "quantity") {
      // Ensure quantity is a valid number
      const qty = typeof value === 'string' ? parseFloat(value) : value;
      newOutputsCopy[index] = { ...newOutputsCopy[index], [field]: isNaN(qty) ? 0 : qty };
    } else {
      newOutputsCopy[index] = { ...newOutputsCopy[index], [field]: value };
    }
    
    setNewOutputs(newOutputsCopy);
  };

  const calculateWastagePercent = () => {
    if (!inputQuantity || !wastageQuantity) return 0;
    
    // Convert wastage quantity to input unit for consistent percentage calc
    // or convert both to pool base unit.
    const inputVal = parseFloat(inputQuantity);
    const wastageVal = parseFloat(wastageQuantity);
    
    if (inputVal <= 0 || wastageVal <= 0) return 0;
    
    // If UOMs differ, convert wastage to input UOM
    if (wastageUom !== inputUom) {
       // We need to convert from wastageUom -> [base] -> inputUom
       // But we only have direct conversions to base usually.
       // Let's assume convertUOMValue can handle it or use poolItem.uom as pivot
       // For safety: wastageUom -> poolItem.uom AND inputUom -> poolItem.uom
       
       const wastageInBase = convertUOMValue(wastageVal, wastageUom, poolItem.uom);
       const inputInBase = convertUOMValue(inputVal, inputUom, poolItem.uom);
       
       if (wastageInBase !== null && inputInBase !== null && inputInBase > 0) {
         return (wastageInBase / inputInBase) * 100;
       }
       return 0;
    }
    
    const wastageInInputUom = wastageVal;
    return (wastageInInputUom / inputVal) * 100;
  };

  const getYieldAnalysis = () => {
    const inputVal = parseFloat(inputQuantity) || 0;
    const inputInBase = inputUom === poolItem.uom 
      ? inputVal 
      : (convertUOMValue(inputVal, inputUom, poolItem.uom) || 0);

    const prevOutputsInBase = previousRecipeItems
      .filter(item => item.selected && item.newQuantity)
      .reduce((sum, item) => {
        const qty = parseFloat(item.newQuantity) || 0;
        const inBase = item.uom === poolItem.uom 
          ? qty 
          : (convertUOMValue(qty, item.uom, poolItem.uom) || 0);
        return sum + inBase;
      }, 0);

    const newOutputsInBase = newOutputs.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const inBase = item.uom === poolItem.uom 
        ? qty 
        : (convertUOMValue(qty, item.uom, poolItem.uom) || 0);
      return sum + inBase;
    }, 0);

    const wastageVal = parseFloat(wastageQuantity) || 0;
    const wastageInBase = wastageUom === poolItem.uom 
      ? wastageVal 
      : (convertUOMValue(wastageVal, wastageUom, poolItem.uom) || 0);

    const totalOutputInBase = prevOutputsInBase + newOutputsInBase;
    const totalAccountedInBase = totalOutputInBase + wastageInBase;
    const variance = inputInBase - totalAccountedInBase;
    const yieldPercent = inputInBase > 0 ? (totalOutputInBase / inputInBase) * 100 : 0;

    return {
      inputInBase,
      totalOutputInBase,
      wastageInBase,
      totalAccountedInBase,
      variance,
      yieldPercent,
      isOverAllocated: variance < -0.001 // Account for floating point
    };
  };

  // Real-time validation
  useEffect(() => {
    if (!inputQuantity) {
      setInputError(null);
      return;
    }

    const inputQty = parseFloat(inputQuantity);
    if (isNaN(inputQty) || inputQty <= 0) {
      // Don't show error for empty/incomplete input, just default
      return;
    }

    let stockToDeduct = inputQty;

    if (inputUom !== poolItem.uom) {
      const converted = convertUOMValue(inputQty, inputUom, poolItem.uom);
      if (converted !== null) {
        stockToDeduct = converted;
      } else {
        setInputError(`Cannot convert ${inputUom} to ${poolItem.uom}`);
        return;
      }
    }

    if (stockToDeduct > poolItem.currentStock) {
      setInputError(`Exceeds stock: ${formatSmartUOMDisplay(stockToDeduct, poolItem.uom)} > ${formatSmartUOMDisplay(poolItem.currentStock, poolItem.uom)}`);
    } else {
      setInputError(null);
    }
  }, [inputQuantity, inputUom, poolItem.uom, poolItem.currentStock]);

  const validateForm = () => {
    if (inputError) {
      toast.error(inputError);
      return false;
    }

    if (!inputQuantity || parseFloat(inputQuantity) <= 0) {
      toast.error("Please enter a valid quantity to process");
      return false;
    }

    // Convert input quantity to pool UOM for comparison
    const inputQty = parseFloat(inputQuantity);
    let stockToDeduct = inputQty;
    
    if (inputUom !== poolItem.uom) {
      const converted = convertUOMValue(inputQty, inputUom, poolItem.uom);
      if (converted !== null) {
        stockToDeduct = converted;
      } else {
        // Validation fails if conversion not possible
        toast.error(`Cannot convert ${inputUom} to ${poolItem.uom}`);
        return false;
      }
    }

    if (stockToDeduct > poolItem.currentStock) {
      toast.error(`Quantity exceeds available stock (${formatSmartUOMDisplay(stockToDeduct, poolItem.uom)} > ${formatSmartUOMDisplay(poolItem.currentStock, poolItem.uom)})`);
      return false;
    }

    const selectedPreviousItems = previousRecipeItems.filter(
      (item) => item.selected && item.newQuantity && parseFloat(item.newQuantity) > 0
    );
    const validNewOutputs = newOutputs.filter(
      (item) => item.itemId && item.quantity > 0
    );

    if (selectedPreviousItems.length === 0 && validNewOutputs.length === 0) {
      toast.error("Please select at least one output item or add a new one");
      return false;
    }

    const invalidPreviousItems = previousRecipeItems.filter(
      (item) => item.selected && (!item.newQuantity || parseFloat(item.newQuantity) <= 0)
    );
    if (invalidPreviousItems.length > 0) {
      toast.error("Please enter valid quantities for all selected items");
      return false;
    }

    for (const output of newOutputs) {
      if (!output.itemId) {
        toast.error("Please select an item for all new outputs");
        return false;
      }
      if (!output.quantity || output.quantity <= 0) {
        toast.error("Please enter valid quantities for all new outputs");
        return false;
      }
    }

    // Duplicate check
    const allOutputIds = [
      ...previousRecipeItems.filter(p => p.selected).map(p => p.itemId),
      ...newOutputs.map(n => n.itemId).filter(id => id)
    ];
    if (new Set(allOutputIds).size !== allOutputIds.length) {
      toast.error("Duplicate items found in outputs. Please combine quantities.");
      return false;
    }

    // Cost validation
    if (processingCost && parseFloat(processingCost) < 0) {
      toast.error("Processing cost cannot be negative");
      return false;
    }

    const { isOverAllocated, variance, inputInBase } = getYieldAnalysis();
    if (isOverAllocated) {
      toast.error(`Invalid Yield: Total output (${formatSmartUOMDisplay(inputInBase - variance, poolItem.uom)}) exceeds input (${formatSmartUOMDisplay(inputInBase, poolItem.uom)})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const selectedPreviousOutputs = previousRecipeItems
        .filter((item) => item.selected && item.newQuantity && parseFloat(item.newQuantity) > 0)
        .map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: parseFloat(item.newQuantity),
          uom: item.uom,
        }));

      const validNewOutputs = newOutputs.filter(
        (item) => item.itemId && item.quantity > 0
      );

      const allOutputs = [...selectedPreviousOutputs, ...validNewOutputs];
      
      const wastagePercent = calculateWastagePercent();

      const processingData = {
        poolId: poolItem.id,
        inputItemId: poolItem.itemId,
        inputQuantity: parseFloat(inputQuantity),
        inputUom: inputUom,
        warehouseId: poolItem.warehouseId,
        outputs: allOutputs,
        wastagePercent: wastagePercent,
        processingCost: parseFloat(processingCost),
        notes: notes.trim() || null,
      };

      console.log("🔄 Processing Transaction Data:", {
        input: `${processingData.inputQuantity} ${processingData.inputUom}`,
        outputs: allOutputs.map(o => `${o.quantity} ${o.uom} ${o.itemName}`),
        wastage: `${wastagePercent.toFixed(2)}%`,
        cost: `₹${processingData.processingCost}`,
      });

      const response = await axiosInstance.post(
        "/api/inventory/processing-transactions",
        processingData
      );

      if (response.data.success) {
        toast.success("Processing completed successfully", {
          description: `Processed ${inputQuantity} ${inputUom} of ${poolItem.itemName}`,
        });
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Error processing:", error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Failed to process items";
      toast.error("Processing failed", {
        description: errorMessage || "Failed to process items",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process: {poolItem.itemName}</DialogTitle>
          <DialogDescription>
            Convert items from the processing pool into finished inventory items.
          </DialogDescription>
        </DialogHeader>

        {isLoadingRecipe || isLoadingItems ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">
                📥 INPUT (From Processing Pool)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Available Stock:</span>
                  <span className="font-semibold">
                    {formatSmartUOMDisplay(poolItem.currentStock, poolItem.uom)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Price:</span>
                  <span className="font-semibold">
                    ₹{poolItem.avgPurchasePrice.toFixed(2)}/{poolItem.uom}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inputQuantity">
                    Quantity to Process <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="inputQuantity"
                      type="number"
                      min="0"
                      // Calculate dynamic max based on selected UOM if possible, else infinite
                      // Logic: 1 Base = X Selected. Max Selected = Stock Base * X
                      // But conversion logic is safer: convert 1 Selected to Base
                      // If 1 Selected = 0.001 Base (e.g. g -> kg), then Base Stock / 0.001 = Max Selected
                      // max={...} 
                      step="0.01"
                      value={inputQuantity}
                      onChange={(e) => setInputQuantity(e.target.value)}
                      placeholder="0"
                      className={inputError ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    <Select
                      value={inputUom}
                      onValueChange={setInputUom}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {poolItem.availableUoms && poolItem.availableUoms.length > 0 ? (
                          poolItem.availableUoms.map((u) => (
                            <SelectItem key={u.uom} value={u.uom}>
                              {u.uom}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={poolItem.uom}>{poolItem.uom}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {inputError && (
                    <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                      {inputError}
                    </p>
                  )}
                </div>
              </div>
            </div>

          
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  📤 OUTPUTS (To Inventory)
                </h3>
              </div>

              {/* Previously Created Items Section */}
              {hasProcessedBefore && previousRecipeItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm">
                      Previously Created Items
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {previousRecipeItems.map((item, index) => (
                      <div
                        key={item.itemId}
                        className="p-3 bg-white dark:bg-gray-900 border rounded-md"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => togglePreviousItem(index)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{item.itemName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Current Stock: <span className="font-semibold text-blue-600">{formatSmartUOMDisplay(item.currentStock, item.uom)}</span>
                                </p>
                              </div>
                              {item.selected && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            {item.selected && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">UOM</Label>
                                  <Select
                                    value={item.uom}
                                    onValueChange={(val) => {
                                      setPreviousRecipeItems(prev => prev.map((p, i) => 
                                        i === index ? { ...p, uom: val } : p
                                      ));
                                    }}
                                  >
                                    <SelectTrigger className="h-10 text-xs">
                                      <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.availableUoms?.map((u) => (
                                        <SelectItem key={u.uom} value={u.uom}>
                                          {u.uom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Add Quantity</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.newQuantity}
                                    onChange={(e) =>
                                      updatePreviousItemQuantity(index, e.target.value)
                                    }
                                    placeholder="0"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">New Stock</Label>
                                  <div className="flex items-center h-10 px-3 bg-blue-50 dark:bg-blue-950 border rounded-md">
                                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                      {formatSmartUOMDisplay(item.currentStock + (parseFloat(item.newQuantity) || 0), item.uom)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* New Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">
                    {hasProcessedBefore ? "Add New Items" : "Create Finished Products"}
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addNewOutput}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {newOutputs.length === 0 && !hasProcessedBefore && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Add output items to specify what finished products will be created
                    </AlertDescription>
                  </Alert>
                )}

                {newOutputs.length > 0 && (
                  <div className="space-y-3">
                    {newOutputs.map((output, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-gray-900 border rounded-md space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">New Item {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewOutput(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Item</Label>
                            <Select
                              value={output.itemId}
                              onValueChange={(value) => updateNewOutput(index, "itemId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingItems ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    Loading...
                                  </div>
                                ) : inventoryItems.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No finished products available
                                  </div>
                                ) : (
                                  inventoryItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.itemName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={output.quantity || ""}
                                onChange={(e) =>
                                  updateNewOutput(index, "quantity", parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                              />
                              <Select
                                value={output.uom}
                                onValueChange={(val) => updateNewOutput(index, "uom", val)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {output.availableUoms?.map((u) => (
                                    <SelectItem key={u.uom} value={u.uom}>
                                      {u.uom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Finished Product Button */}
              {inventoryItems.length === 0 && !isLoadingItems && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                    No finished products found in category &quot;{poolItem.category}&quot;
                  </p>
                  <AddItemButton>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Finished Product
                  </AddItemButton>
                </div>
              )}
            </div>

            {/* Yield Summary */}
            {parseFloat(inputQuantity) > 0 && (
              <div className={`p-4 rounded-lg border flex flex-col gap-2 ${
                getYieldAnalysis().isOverAllocated 
                ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${getYieldAnalysis().isOverAllocated ? "text-red-600" : "text-blue-600"}`} />
                    Yield Summary ({getYieldAnalysis().yieldPercent.toFixed(1)}% efficiency)
                  </h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    getYieldAnalysis().isOverAllocated ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800"
                  }`}>
                    {getYieldAnalysis().isOverAllocated ? "Over-allocated" : "Balanced"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Total Input</span>
                    <span className="font-bold">{formatSmartUOMDisplay(getYieldAnalysis().inputInBase, poolItem.uom)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Goods + Waste</span>
                    <span className="font-bold">{formatSmartUOMDisplay(getYieldAnalysis().totalAccountedInBase, poolItem.uom)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={`font-bold ${getYieldAnalysis().isOverAllocated ? "text-red-600" : "text-green-600"}`}>
                      {formatSmartUOMDisplay(getYieldAnalysis().variance, poolItem.uom)}
                    </span>
                  </div>
                </div>
                {getYieldAnalysis().isOverAllocated && (
                  <p className="text-[10px] text-red-600 font-medium">
                    ⚠️ Error: Sum of output products and wastage cannot exceed the total raw input.
                  </p>
                )}
              </div>
            )}

            {/* Wastage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wastageQuantity">Wastage Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    id="wastageQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={wastageQuantity}
                    onChange={(e) => setWastageQuantity(e.target.value)}
                    placeholder="0"
                  />
                  <Select
                    value={wastageUom}
                    onValueChange={setWastageUom}
                  >
                    <SelectTrigger className="w-[100px]">
                       <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {poolItem.availableUoms && poolItem.availableUoms.length > 0 ? (
                        poolItem.availableUoms.map((u) => (
                          <SelectItem key={u.uom} value={u.uom}>
                            {u.uom}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={poolItem.uom}>{poolItem.uom}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {wastageQuantity && inputQuantity && (
                   <p className="text-xs text-muted-foreground">
                     Raw Wastage: {calculateWastagePercent().toFixed(2)}%
                   </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processingCost">Processing Cost (₹)</Label>
                <Input
                  id="processingCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={processingCost}
                  onChange={(e) => setProcessingCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this processing..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingRecipe || isLoadingItems}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
