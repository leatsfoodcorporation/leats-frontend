"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Trash2, Package, ArrowLeft, Save, X, Check, ChevronsUpDown, Sparkles, Loader2 } from "lucide-react";
import { ecommerceProductService } from "@/services/online-services/ecommerceProductService";
import { ProductData, ProductFormData } from "@/types/product";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";
import { formatSmartUOMDisplay } from "@/lib/uom-constants";
import FileUpload from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  gstRateService,
  GSTRate,
} from "@/services/online-services/gstRateService";
import { cuttingStyleService, CuttingStyle } from "@/services/online-services/cuttingStyleService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrequentlyBoughtTogetherTab } from "../online/tabs/frequently-bought-together-tab";

interface ComboItem {
  productId: string;
  inventoryProductId?: string | null; // 🆕 Added for stock deduction
  variantIndex: number;
  quantity: number;
  // Cached data for display
  productName: string;
  variantName: string;
  variantImage?: string;
  variantPrice: number;
  variantUom?: string;
  variantUomValue?: number;
  category: string;
}

interface ComboProductFormData {
  comboName: string;
  comboDescription: string;
  comboImage?: File | string;
  items: ComboItem[];
  totalPrice: number;
  sellingPrice: number;
  discountType: "percentage" | "flat";
  discountValue: number;
  // Visibility
  isComboHomePageEnabled: boolean;
  status: "active" | "draft";
  type: "combo";
  // Shipping & Delivery
  shippingCharge: number;
  freeShipping: boolean;
  isCODAvailable: boolean;
  // Tax
  gstPercentage: number;
  hsnCode: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  // Inventory
  totalWeight: number;
  stockStatus: string;
  // Additional
  returnPolicyApplicable: boolean;
  returnWindowDays: number;
  warrantyDetails: string;
  // New fields
  cuttingStyles: string[];
  frequentlyBoughtTogether: any[];
}

interface SelectedProduct {
  productId: string;
  selectedVariants: number[]; // Array of variant indices
  selectedCategory?: string; // Track selected category for this product slot
}

interface ComboProductFormProps {
  productId?: string; // Optional: for editing existing combo products
}

export function ComboProductForm({ productId }: ComboProductFormProps = {}) {
  const router = useRouter();
  const currencySymbol = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [openProductCombobox, setOpenProductCombobox] = useState<{ [key: number]: boolean }>({});
  const [gstRates, setGstRates] = useState<GSTRate[]>([]);
  const [isLoadingGST, setIsLoadingGST] = useState(false);
  const [cuttingStyles, setCuttingStyles] = useState<CuttingStyle[]>([]);
  const [isLoadingCuttingStyles, setIsLoadingCuttingStyles] = useState(false);
  const [showAddCuttingStyle, setShowAddCuttingStyle] = useState(false);
  const [newCuttingStyleName, setNewCuttingStyleName] = useState("");

  // Track last edited price field for smart calculation
  const [lastEditedPriceField, setLastEditedPriceField] = useState<
    "sellingPrice" | "totalPrice" | "discount"
  >("sellingPrice");

  const [formData, setFormData] = useState<ComboProductFormData>({
    comboName: "",
    comboDescription: "",
    items: [],
    totalPrice: 0,
    sellingPrice: 0,
    discountType: "percentage",
    discountValue: 0,
    status: "draft",
    isComboHomePageEnabled: false,
    type: "combo",
    // Shipping & Delivery
    shippingCharge: 0,
    freeShipping: false,
    isCODAvailable: true,
    // Tax
    gstPercentage: 0,
    hsnCode: "",
    // SEO
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    // Inventory
    totalWeight: 0,
    stockStatus: "in-stock",
    // Additional
    returnPolicyApplicable: true,
    returnWindowDays: 7,
    warrantyDetails: "",
    cuttingStyles: [],
    frequentlyBoughtTogether: [],
  });

  // Fetch all products and GST rates on mount
  useEffect(() => {
    fetchProducts();
    fetchGSTRates();
    fetchCuttingStyles();
  }, []);

  // Fetch product data for editing
  useEffect(() => {
    if (productId) {
      fetchProductData(productId);
    }
  }, [productId]);

  // Auto-generate combo name from selected items (with UOM)
  useEffect(() => {
    if (formData.items.length > 0 && !productId) {
      // Only auto-generate for new combos, not when editing
      const itemNames = formData.items.map(item => {
        // Use only variant name as it already contains the product info
        let displayName = item.variantName;
        
        // Add UOM if available and not already in variant name
        if (item.variantUom && item.variantUomValue) {
          const uomDisplay = formatSmartUOMDisplay(item.variantUomValue, item.variantUom);
          // Only add UOM if it's not already in the variant name
          if (!displayName.includes(uomDisplay)) {
            displayName += ` ${uomDisplay}`;
          }
        }
        
        return displayName;
      });
      
      const generatedName = itemNames.join(" + ") + " Combo";
      
      // Only update comboName, leave comboDescription empty for user to fill
      setFormData(prev => ({
        ...prev,
        comboName: generatedName,
        // Don't auto-fill description - let user enter their own
      }));
    }
  }, [formData.items, productId]);

  const fetchProductData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await ecommerceProductService.getProductById(id);
      
      if (response.success && response.data) {
        const product = response.data;
        
        // Parse comboItems
        let comboItems: any[] = [];
        try {
          comboItems = typeof product.comboItems === 'string' 
            ? JSON.parse(product.comboItems) 
            : product.comboItems || [];
        } catch (e) {
          console.warn("Failed to parse combo items");
        }

        // Populate form data
        setFormData({
          comboName: product.variants?.[0]?.displayName || (product as any).itemName || product.shortDescription || "",
          comboDescription: product.shortDescription || "",
          comboImage: product.thumbnail,
          items: comboItems.map((item: any) => ({
            productId: item.productId,
            inventoryProductId: item.inventoryProductId, // 🆕 Load saved inventory ID
            variantIndex: item.variantIndex || 0,
            quantity: item.quantity || 1,
            productName: item.productName || "",
            variantName: item.variantName || "",
            variantImage: item.variantImage || "",
            variantPrice: item.variantPrice || 0,
            variantUom: item.variantUom,
            variantUomValue: item.variantUomValue,
            category: product.category || ""
          })),
          totalPrice: product.defaultMRP,
          sellingPrice: product.defaultSellingPrice,
          discountType: product.discountType === "Percent" ? "percentage" : "flat",
          discountValue: product.defaultDiscountValue,
          isComboHomePageEnabled: product.isComboHomePageEnabled || false,
          status: product.productStatus as "active" | "draft",
          type: "combo",
          shippingCharge: product.shippingCharge || 0,
          freeShipping: product.freeShipping || false,
          isCODAvailable: product.isCODAvailable ?? true,
          gstPercentage: product.gstPercentage || 0,
          hsnCode: product.hsnCode || "",
          metaTitle: product.metaTitle || "",
          metaDescription: product.metaDescription || "",
          metaKeywords: product.metaKeywords || "",
          totalWeight: 0,
          stockStatus: "in_stock",
          returnPolicyApplicable: product.returnPolicyApplicable ?? true,
          returnWindowDays: product.returnWindowDays || 7,
          warrantyDetails: product.warrantyDetails || "",
          cuttingStyles: product.cuttingStyles || [],
          frequentlyBoughtTogether: product.frequentlyBoughtTogether || []
        });
        
        // Populate selectedProducts state to show items in the UI
        // Group items by productId to build the selectedProducts structure
        const productMap = new Map<string, SelectedProduct>();
        
        comboItems.forEach((item: any) => {
          if (!productMap.has(item.productId)) {
            productMap.set(item.productId, {
              productId: item.productId,
              selectedVariants: [],
              selectedCategory: "all" // Will be updated when products are fetched
            });
          }
          const selectedProduct = productMap.get(item.productId)!;
          selectedProduct.selectedVariants.push(item.variantIndex || 0);
        });
        
        setSelectedProducts(Array.from(productMap.values()));
        
        toast.success("Product data loaded");
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      toast.error("Failed to load product data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGSTRates = async () => {
    try {
      setIsLoadingGST(true);
      const response = await gstRateService.getActiveGSTRates();
      if (response.success) {
        setGstRates(response.data);
      }
    } catch (error: unknown) {
      console.error("Error fetching GST rates:", error);
      toast.error("Failed to load GST rates");
    } finally {
      setIsLoadingGST(false);
    }
  };
  
  const fetchCuttingStyles = async () => {
    try {
      setIsLoadingCuttingStyles(true);
      const response = await cuttingStyleService.getActiveCuttingStyles();
      if (response.success) {
        setCuttingStyles(response.data);
      }
    } catch (error: unknown) {
      console.error("Error fetching cutting styles:", error);
    } finally {
      setIsLoadingCuttingStyles(false);
    }
  };

  const handleCuttingStyleToggle = (styleId: string, checked: boolean) => {
    const currentStyles = formData.cuttingStyles || [];
    let newStyles: string[];
    
    if (checked) {
      newStyles = [...currentStyles, styleId];
    } else {
      newStyles = currentStyles.filter((id) => id !== styleId);
    }
    
    setFormData(prev => ({ ...prev, cuttingStyles: newStyles }));
  };

  const handleAddCuttingStyle = async () => {
    if (!newCuttingStyleName.trim()) return;

    try {
      const response = await cuttingStyleService.createCuttingStyle({
        name: newCuttingStyleName.trim(),
      });
      
      if (response.success) {
        setCuttingStyles((prev) => [...prev, response.data]);
        handleCuttingStyleToggle(response.data.id, true);
        setNewCuttingStyleName("");
        setShowAddCuttingStyle(false);
        toast.success("Cutting style created successfully");
      }
    } catch (error: unknown) {
      console.error("Error adding cutting style:", error);
      toast.error("Failed to create cutting style");
    }
  };

  const handleGenerateSEO = async () => {
    if (!formData.comboName || formData.comboName === "New Combo") {
      toast.error("Please enter a combo name first");
      return;
    }

    try {
      setIsGeneratingSEO(true);
      const response = await ecommerceProductService.generateSEO({
        productName: formData.comboName,
        category: "Combo Products",
        subCategory: "",
        shortDescription: formData.comboDescription || "",
      });

      if (response.success && response.data) {
        setFormData((prev) => ({
          ...prev,
          metaTitle: response.data!.metaTitle,
          metaDescription: response.data!.metaDescription,
          metaKeywords: response.data!.metaKeywords,
        }));
        toast.success("SEO content generated successfully!");
      }
    } catch (error) {
      console.error("Error generating SEO:", error);
      toast.error("Failed to generate SEO content");
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  // Smart price calculation based on last edited field
  const calculatePricesSmartly = (
    sellingPrice: number,
    totalPrice: number,
    discount: number,
    discountType: "percentage" | "flat",
    changedField: "sellingPrice" | "totalPrice" | "discount"
  ) => {
    // Ensure all values are valid numbers
    const validSellingPrice = isNaN(sellingPrice) || sellingPrice < 0 ? 0 : sellingPrice;
    const validTotalPrice = isNaN(totalPrice) || totalPrice < 0 ? 0 : totalPrice;
    const validDiscount = isNaN(discount) || discount < 0 ? 0 : discount;

    // Update last edited field tracker
    setLastEditedPriceField(changedField);

    // SMART LOGIC: Calculate based on what the user is doing
    if (changedField === "discount") {
      // User changed discount - calculate based on which price field was edited last
      if (lastEditedPriceField === "totalPrice") {
        // User previously edited Total Price, so calculate Selling Price
        if (discountType === "percentage") {
          const calculatedSellingPrice = validTotalPrice * (1 - validDiscount / 100);
          return {
            totalPrice: validTotalPrice,
            sellingPrice: Math.round(calculatedSellingPrice) || 0,
            discount: validDiscount,
          };
        } else {
          const calculatedSellingPrice = validTotalPrice - validDiscount;
          return {
            totalPrice: validTotalPrice,
            sellingPrice: Math.max(0, Math.round(calculatedSellingPrice)) || 0,
            discount: validDiscount,
          };
        }
      } else {
        // Default or user edited Selling Price last, so calculate Total Price
        if (discountType === "percentage") {
          if (validDiscount >= 100) {
            return {
              totalPrice: validSellingPrice,
              sellingPrice: validSellingPrice,
              discount: validDiscount,
            };
          }
          const calculatedTotalPrice =
            validDiscount > 0
              ? validSellingPrice / (1 - validDiscount / 100)
              : validSellingPrice;
          return {
            totalPrice: Math.round(calculatedTotalPrice) || 0,
            sellingPrice: validSellingPrice,
            discount: validDiscount,
          };
        } else {
          const calculatedTotalPrice = validSellingPrice + validDiscount;
          return {
            totalPrice: Math.round(calculatedTotalPrice) || 0,
            sellingPrice: validSellingPrice,
            discount: validDiscount,
          };
        }
      }
    } else if (changedField === "sellingPrice") {
      // User changed Selling Price - calculate Total Price (keep discount)
      if (discountType === "percentage") {
        if (validDiscount >= 100) {
          return {
            totalPrice: validSellingPrice,
            sellingPrice: validSellingPrice,
            discount: validDiscount,
          };
        }
        const calculatedTotalPrice =
          validDiscount > 0
            ? validSellingPrice / (1 - validDiscount / 100)
            : validSellingPrice;
        return {
          totalPrice: Math.round(calculatedTotalPrice) || 0,
          sellingPrice: validSellingPrice,
          discount: validDiscount,
        };
      } else {
        const calculatedTotalPrice = validSellingPrice + validDiscount;
        return {
          totalPrice: Math.round(calculatedTotalPrice) || 0,
          sellingPrice: validSellingPrice,
          discount: validDiscount,
        };
      }
    } else if (changedField === "totalPrice") {
      // User changed Total Price - calculate Selling Price (keep discount)
      if (discountType === "percentage") {
        const calculatedSellingPrice = validTotalPrice * (1 - validDiscount / 100);
        return {
          totalPrice: validTotalPrice,
          sellingPrice: Math.round(calculatedSellingPrice) || 0,
          discount: validDiscount,
        };
      } else {
        const calculatedSellingPrice = validTotalPrice - validDiscount;
        return {
          totalPrice: validTotalPrice,
          sellingPrice: Math.max(0, Math.round(calculatedSellingPrice)) || 0,
          discount: validDiscount,
        };
      }
    }

    return {
      totalPrice: validTotalPrice,
      sellingPrice: validSellingPrice,
      discount: validDiscount,
    };
  };

  // Calculate total price whenever items change
  useEffect(() => {
    const total = formData.items.reduce(
      (sum, item) => sum + item.variantPrice * item.quantity,
      0
    );
    setFormData((prev) => ({ ...prev, totalPrice: total }));
  }, [formData.items]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await ecommerceProductService.getProducts({
        page: 1,
        limit: 1000,
        status: "active",
      });
      
      // ✅ Filter out combo products - we only want regular products for combo items
      const regularProducts = response.data.filter(p => p.type !== 'combo');
      setProducts(regularProducts);
      
      // Extract unique categories, excluding "Combo Products"
      const uniqueCategories = Array.from(
        new Set(regularProducts.map((p) => p.category))
      )
        .filter(cat => cat !== "Combo Products") // ✅ Exclude combo category
        .sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products by selected category
  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { productId: "", selectedVariants: [], selectedCategory: "all" },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    const newSelectedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newSelectedProducts);
    
    // Remove all items from this product
    const productId = selectedProducts[index].productId;
    if (productId) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.productId !== productId),
      }));
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    const newSelectedProducts = [...selectedProducts];
    newSelectedProducts[index] = {
      ...newSelectedProducts[index],
      selectedCategory: category,
      productId: "", // Reset product when category changes
      selectedVariants: [],
    };
    setSelectedProducts(newSelectedProducts);
    
    // Remove items from this product slot
    const oldProductId = selectedProducts[index].productId;
    if (oldProductId) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.productId !== oldProductId),
      }));
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const newSelectedProducts = [...selectedProducts];
    newSelectedProducts[index] = {
      ...newSelectedProducts[index], // Preserve existing properties including selectedCategory
      productId,
      selectedVariants: [],
    };
    setSelectedProducts(newSelectedProducts);
    
    // Remove old items from this product slot
    const oldProductId = selectedProducts[index].productId;
    if (oldProductId) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.productId !== oldProductId),
      }));
    }
  };

  const handleVariantToggle = (
    productIndex: number,
    variantIndex: number,
    checked: boolean
  ) => {
    const selectedProduct = selectedProducts[productIndex];
    const product = products.find((p) => p.id === selectedProduct.productId);
    
    if (!product) return;

    const newSelectedProducts = [...selectedProducts];
    
    if (checked) {
      // Add variant
      newSelectedProducts[productIndex].selectedVariants.push(variantIndex);
      
      // Add to combo items
      const variant = product.variants[variantIndex];
      const newItem: ComboItem = {
        productId: product.id,
        inventoryProductId: variant.inventoryProductId, // 🆕 Capture inventory ID from variant
        variantIndex,
        quantity: 1,
        productName: product.brand || product.shortDescription || "Product",
        variantName: variant.variantName,
        variantImage: variant.variantImages?.[0] as string,
        variantPrice: variant.variantSellingPrice,
        variantUom: variant.variantUom,
        variantUomValue: variant.variantUomValue,
        category: product.category,
      };
      
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    } else {
      // Remove variant
      newSelectedProducts[productIndex].selectedVariants = 
        newSelectedProducts[productIndex].selectedVariants.filter(
          (v) => v !== variantIndex
        );
      
      // Remove from combo items
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) =>
            !(item.productId === product.id && item.variantIndex === variantIndex)
        ),
      }));
    }
    
    setSelectedProducts(newSelectedProducts);
  };

  const handleQuantityChange = (productId: string, variantIndex: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId && item.variantIndex === variantIndex
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }));
  };

  const handleComboImageUpload = (file: File) => {
    setComboImageFile(file);
    setFormData((prev) => ({ ...prev, comboImage: file }));
    toast.success("Combo image uploaded successfully");
  };

  const handleComboImageRemove = () => {
    setComboImageFile(null);
    setFormData((prev) => ({ ...prev, comboImage: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.comboName.trim()) {
      toast.error("Please enter combo product name");
      return;
    }

    // Validate minimum 2 products required for combo
    if (formData.items.length < 2) {
      toast.error("Combo product must have at least 2 products");
      return;
    }

    // Check if all items are selected
    const hasEmptyItems = formData.items.some((item) => !item.productId);
    if (hasEmptyItems) {
      toast.error("Please select products for all combo items");
      return;
    }

    // Validate cutting styles - required
    if (!formData.cuttingStyles || formData.cuttingStyles.length === 0) {
      toast.error("Please select at least one cutting style");
      return;
    }

    // Validate combo image - required
    if (!comboImageFile && !formData.comboImage) {
      toast.error("Please upload a combo image");
      return;
    }

    setIsSaving(true);
    try {
      // Variants (Combo products need at least one variant for logic consistency)
      // Use a more descriptive variant name based on combo items
      const variantDisplayName = formData.items.length > 0
        ? `Combo Pack (${formData.items.length} items)`
        : "Combo Pack";
      
      const defaultVariant = {
        variantName: variantDisplayName,
        displayName: formData.comboName,
        variantMRP: formData.totalPrice,
        variantSellingPrice: formData.sellingPrice,
        variantStockQuantity: 999,
        isDefault: true,
        variantStatus: "active"
      };

      // Combo Items - Store as comboItems with full product details
      const comboItems = formData.items.map(item => ({
        productId: item.productId,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
        productName: item.productName,
        variantName: item.variantName,
        variantImage: item.variantImage,
        variantPrice: item.variantPrice,
        variantUom: item.variantUom,
        variantUomValue: item.variantUomValue,
        isDefaultSelected: true
      }));

      // Prepare product data object
      const productDataObj = {
        category: "Combo Products",
        subCategory: "",
        brand: "Combo",
        itemName: formData.comboName, 
        comboDescription: formData.comboDescription,
        shortDescription: formData.comboDescription || "",
        type: "combo",
        isComboHomePageEnabled: formData.isComboHomePageEnabled,
        productStatus: formData.status,
        defaultMRP: formData.totalPrice,
        defaultSellingPrice: formData.sellingPrice,
        discountType: formData.discountType === "percentage" ? "Percent" : "Flat",
        defaultDiscountValue: formData.discountValue,
        gstPercentage: formData.gstPercentage,
        hsnCode: formData.hsnCode,
        isCODAvailable: formData.isCODAvailable,
        shippingCharge: formData.shippingCharge,
        freeShipping: formData.freeShipping,
        metaTitle: formData.metaTitle || "",
        metaDescription: formData.metaDescription || "",
        metaKeywords: formData.metaKeywords || "",
        returnPolicyApplicable: formData.returnPolicyApplicable,
        returnWindowDays: formData.returnWindowDays,
        warrantyDetails: formData.warrantyDetails || "",
        comboItems: comboItems,
        frequentlyBoughtTogether: formData.frequentlyBoughtTogether,
        cuttingStyles: formData.cuttingStyles,
        variants: [defaultVariant],
        // Include existing thumbnail URL when editing (if no new file)
        ...(formData.comboImage && !comboImageFile && { thumbnail: formData.comboImage })
      };

      const payload = new FormData();
      
      // Append product data as JSON string
      payload.append("productData", JSON.stringify(productDataObj));
      
      // Append combo image file if present
      if (comboImageFile) {
        payload.append("thumbnail", comboImageFile);
      }

      let response;
      if (productId) {
        // UPDATE existing combo product
        response = await ecommerceProductService.updateProduct(productId, payload as any);
        
        if (response.success) {
          toast.success("Combo product updated successfully!");
          router.push("/dashboard/products-list/combo");
        } else {
          toast.error(response.message || "Failed to update combo product");
        }
      } else {
        // CREATE new combo product
        response = await ecommerceProductService.createProduct(payload as any);
        
        if (response.success) {
          toast.success("Combo product created successfully!");
          router.push("/dashboard/products-list/combo");
        } else {
          toast.error(response.message || "Failed to create combo product");
        }
      }
    } catch (error) {
      console.error(`Error ${productId ? 'updating' : 'creating'} combo product:`, error);
      toast.error(`Failed to ${productId ? 'update' : 'create'} combo product`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {productId ? "Edit Combo Product" : "Create Combo Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bundle multiple products together at a special price
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving 
              ? (productId ? "Updating..." : "Saving...") 
              : (productId ? "Update Combo" : "Save Combo")
            }
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the combo product details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comboName">
                  Combo Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comboName"
                  placeholder="e.g., Chicken & Mutton Combo Pack"
                  value={formData.comboName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comboName: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comboDescription">Description</Label>
                <Textarea
                  id="comboDescription"
                  placeholder="Describe what's included in this combo..."
                  value={formData.comboDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comboDescription: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Combo Image <span className="text-destructive">*</span>
                </Label>
                <FileUpload
                  onUploadSuccess={handleComboImageUpload}
                  onFileRemove={handleComboImageRemove}
                  acceptedFileTypes={["image/jpeg", "image/png", "image/jpg", "image/webp"]}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  currentFile={comboImageFile}
                  existingImageUrl={typeof formData.comboImage === 'string' ? formData.comboImage : undefined}
                  uploadDelay={0}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Combo Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Combo Items</CardTitle>
                  <CardDescription>
                    Select products and their variants for this combo
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No products added yet</p>
                  <p className="text-sm">Click &quot;Add Product&quot; to start building your combo</p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-4">
                  {selectedProducts.map((selectedProduct, productIndex) => {
                    const product = products.find((p) => p.id === selectedProduct.productId);
                    
                    // Get filtered products based on selected category for this card
                    const filteredProductsForCard = selectedProduct.selectedCategory && selectedProduct.selectedCategory !== "all"
                      ? products.filter(p => p.category === selectedProduct.selectedCategory)
                      : products;

                    // Generate a display name for the accordion trigger
                    const displayName = product 
                      ? `${product.brand} - ${product.shortDescription}`
                      : `Product ${productIndex + 1}`;

                    return (
                      <AccordionItem key={productIndex} value={`product-${productIndex}`} className="border-2 rounded-lg">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">Product {productIndex + 1}</span>
                              {product && (
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {displayName}
                              </span>
                            </div>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProduct(productIndex);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  handleRemoveProduct(productIndex);
                                }
                              }}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 pt-4">

                          {/* Category Filter & Product Selection - Single Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category Filter */}
                            <div className="space-y-2">
                              <Label>Filter by Category</Label>
                              <Select
                                value={selectedProduct.selectedCategory || "all"}
                                onValueChange={(value) => handleCategoryChange(productIndex, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Categories</SelectItem>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Product Combobox with Search */}
                            <div className="space-y-2">
                              <Label>
                                Select Product <span className="text-destructive">*</span>
                              </Label>
                              <Popover 
                                open={openProductCombobox[productIndex]} 
                                onOpenChange={(open) => 
                                  setOpenProductCombobox(prev => ({ ...prev, [productIndex]: open }))
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openProductCombobox[productIndex]}
                                    className="w-full justify-between"
                                  >
                                    {selectedProduct.productId ? (
                                      <div className="flex items-center gap-2 truncate">
                                        <Badge variant="outline" className="text-xs">
                                          {product?.category}
                                        </Badge>
                                        <span className="truncate">{product?.brand}</span>
                                      </div>
                                    ) : (
                                      "Choose a product..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search products..." />
                                    <CommandList>
                                      <CommandEmpty>No product found.</CommandEmpty>
                                      <CommandGroup>
                                        {filteredProductsForCard.map((prod) => {
                                          // Get default variant for UOM display
                                          const defaultVariant = prod.variants.find(v => v.isDefault) || prod.variants[0];
                                          const uomDisplay = defaultVariant?.variantUom && defaultVariant?.variantUomValue
                                            ? ` (${formatSmartUOMDisplay(defaultVariant.variantUomValue, defaultVariant.variantUom)})`
                                            : '';
                                          
                                          return (
                                            <CommandItem
                                              key={prod.id}
                                              value={`${prod.brand} ${prod.shortDescription} ${prod.category}`}
                                              onSelect={() => {
                                                handleProductSelect(productIndex, prod.id);
                                                setOpenProductCombobox(prev => ({ ...prev, [productIndex]: false }));
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  selectedProduct.productId === prod.id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                  {prod.category}
                                                </Badge>
                                                <span className="truncate">
                                                  {prod.brand}
                                                  <span className="text-muted-foreground text-xs ml-1">
                                                    - {prod.shortDescription}
                                                  </span>
                                                  {uomDisplay && (
                                                    <span className="text-primary text-xs ml-1 font-medium">
                                                      {uomDisplay}
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            </CommandItem>
                                          );
                                        })}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Variants Multi-Select */}
                          {product && (
                            <div className="space-y-3">
                              <Label>
                                Select Variant <span className="text-destructive">*</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Select only one variant per product)
                                </span>
                              </Label>
                              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto p-1">
                                {product.variants.map((variant, variantIndex) => {
                                  const isSelected = selectedProduct.selectedVariants.includes(variantIndex);
                                  const hasOtherVariantSelected = selectedProduct.selectedVariants.length > 0 && !isSelected;
                                  const isDisabled = hasOtherVariantSelected;
                                  const comboItem = formData.items.find(
                                    (item) =>
                                      item.productId === product.id &&
                                      item.variantIndex === variantIndex
                                  );

                                  return (
                                    <Card
                                      key={variantIndex}
                                      className={`transition-all ${
                                        isSelected
                                          ? "border-primary border-2 bg-primary/5"
                                          : isDisabled
                                          ? "border opacity-50 cursor-not-allowed bg-muted/50"
                                          : "border hover:border-primary/50 cursor-pointer"
                                      }`}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                          {/* Checkbox */}
                                          <Checkbox
                                            checked={isSelected}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) =>
                                              handleVariantToggle(
                                                productIndex,
                                                variantIndex,
                                                checked as boolean
                                              )
                                            }
                                            className="mt-1"
                                          />

                                          {/* Variant Image */}
                                          {variant.variantImages?.[0] && typeof variant.variantImages[0] === 'string' && variant.variantImages[0].trim() !== '' && (
                                            <div className="flex-shrink-0">
                                              <Image
                                                src={variant.variantImages[0] as string}
                                                alt={variant.variantName}
                                                width={60}
                                                height={60}
                                                className={`rounded-md object-cover ${
                                                  isDisabled ? "opacity-50" : ""
                                                }`}
                                              />
                                            </div>
                                          )}

                                          {/* Variant Details */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1">
                                                <h4 className={`font-medium text-sm ${
                                                  isDisabled ? "text-muted-foreground" : ""
                                                }`}>
                                                  {variant.variantName}
                                                </h4>
                                                {variant.displayName && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {variant.displayName}
                                                  </p>
                                                )}
                                                {variant.variantUom && variant.variantUomValue ? (
                                                  <Badge variant="secondary" className="mt-1 text-xs">
                                                    {formatSmartUOMDisplay(
                                                      variant.variantUomValue,
                                                      variant.variantUom
                                                    )}
                                                  </Badge>
                                                ) : variant.variantUom ? (
                                                  <Badge variant="secondary" className="mt-1 text-xs">
                                                    {variant.variantUom}
                                                  </Badge>
                                                ) : null}
                                              </div>
                                              <div className="text-right">
                                                <p className={`font-semibold text-sm ${
                                                  isDisabled ? "text-muted-foreground" : ""
                                                }`}>
                                                  {currencySymbol}
                                                  {variant.variantSellingPrice.toFixed(2)}
                                                </p>
                                                {variant.variantMRP > variant.variantSellingPrice && (
                                                  <p className="text-xs text-muted-foreground line-through">
                                                    {currencySymbol}
                                                    {variant.variantMRP.toFixed(2)}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}

              {/* Selected Items Summary */}
              {formData.items.length > 0 && (
                <Card className="bg-muted/50 mt-6">
                  <CardHeader>
                    <CardTitle className="text-base">Selected Items Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {item.variantImage && typeof item.variantImage === 'string' && item.variantImage.trim() !== '' && (
                              <Image
                                src={item.variantImage}
                                alt={item.variantName}
                                width={32}
                                height={32}
                                className="rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {item.productName} - {item.variantName}
                              </p>
                              {item.variantUom && item.variantUomValue ? (
                                <p className="text-xs text-muted-foreground">
                                  {formatSmartUOMDisplay(item.variantUomValue, item.variantUom)}
                                </p>
                              ) : item.variantUom ? (
                                <p className="text-xs text-muted-foreground">
                                  {item.variantUom}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {currencySymbol}
                              {item.variantPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Cutting Styles */}
          <Card>
            <CardHeader>
              <CardTitle>
                Cutting Styles <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>
                Select cutting styles available for this combo (for meat/fish products)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingCuttingStyles ? (
                <div className="text-sm text-muted-foreground">Loading cutting styles...</div>
              ) : (
                <div className="space-y-3">
                  {/* Cutting Styles Checkboxes */}
                  <div className="flex flex-wrap gap-3">
                    {cuttingStyles.map((style) => (
                      <div key={style.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cutting-style-${style.id}`}
                          checked={(formData.cuttingStyles || []).includes(style.id)}
                          onCheckedChange={(checked) => handleCuttingStyleToggle(style.id, checked as boolean)}
                        />
                        <Label
                          htmlFor={`cutting-style-${style.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {style.name}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Add New Cutting Style */}
                  {!showAddCuttingStyle ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCuttingStyle(true)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Cutting Style
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Input
                        value={newCuttingStyleName}
                        onChange={(e) => setNewCuttingStyleName(e.target.value)}
                        placeholder="Enter cutting style name"
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCuttingStyle();
                          }
                          if (e.key === "Escape") {
                            setShowAddCuttingStyle(false);
                            setNewCuttingStyleName("");
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddCuttingStyle} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddCuttingStyle(false);
                          setNewCuttingStyleName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Selected Count */}
                  {(formData.cuttingStyles || []).length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {(formData.cuttingStyles || []).length} cutting style(s) selected
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frequently Bought Together */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Bought Together (Add-ons)</CardTitle>
              <CardDescription>
                Add complementary products that customers can purchase along with this combo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FrequentlyBoughtTogetherTab
                formData={{
                  id: undefined,
                  frequentlyBoughtTogether: formData.frequentlyBoughtTogether,
                } as any}
                onChange={(field, value) => {
                  setFormData(prev => ({ ...prev, frequentlyBoughtTogether: value as any[] }));
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-xs text-blue-900">
                  Enter Selling Price + Discount to auto-calculate Total Price, OR enter Total Price + Discount to auto-calculate Selling Price
                </p>
              </div>

              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "flat") => {
                    const prices = calculatePricesSmartly(
                      formData.sellingPrice,
                      formData.totalPrice,
                      formData.discountValue,
                      value,
                      lastEditedPriceField
                    );
                    setFormData((prev) => ({
                      ...prev,
                      discountType: value,
                      totalPrice: prices.totalPrice,
                      sellingPrice: prices.sellingPrice,
                      discountValue: prices.discount,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount ({currencySymbol})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Discount Value
                  {formData.discountType === "percentage" && " (%)"}
                  {formData.discountType === "flat" && ` (${currencySymbol})`}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={formData.discountType === "percentage" ? "100" : undefined}
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => {
                    const newDiscount = parseFloat(e.target.value) || 0;
                    const prices = calculatePricesSmartly(
                      formData.sellingPrice,
                      formData.totalPrice,
                      newDiscount,
                      formData.discountType,
                      "discount"
                    );
                    setFormData((prev) => ({
                      ...prev,
                      totalPrice: prices.totalPrice,
                      sellingPrice: prices.sellingPrice,
                      discountValue: prices.discount,
                    }));
                  }}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Selling Price ({currencySymbol}) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => {
                    const newSellingPrice = parseFloat(e.target.value) || 0;
                    const prices = calculatePricesSmartly(
                      newSellingPrice,
                      formData.totalPrice,
                      formData.discountValue,
                      formData.discountType,
                      "sellingPrice"
                    );
                    setFormData((prev) => ({
                      ...prev,
                      totalPrice: prices.totalPrice,
                      sellingPrice: prices.sellingPrice,
                      discountValue: prices.discount,
                    }));
                  }}
                  placeholder="0"
                  className="font-semibold"
                />
                <p className="text-xs text-green-600">
                  Customer pays this price
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  Total Price ({currencySymbol}) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalPrice}
                  onChange={(e) => {
                    const newTotalPrice = parseFloat(e.target.value) || 0;
                    const prices = calculatePricesSmartly(
                      formData.sellingPrice,
                      newTotalPrice,
                      formData.discountValue,
                      formData.discountType,
                      "totalPrice"
                    );
                    setFormData((prev) => ({
                      ...prev,
                      totalPrice: prices.totalPrice,
                      sellingPrice: prices.sellingPrice,
                      discountValue: prices.discount,
                    }));
                  }}
                  placeholder="0"
                  className="font-semibold"
                />
                <p className="text-xs text-blue-600">
                  Original combo price (before discount)
                </p>
              </div>

              {/* Savings Display */}
              {formData.totalPrice > formData.sellingPrice && formData.sellingPrice > 0 && (
                <div className="p-3 bg-green-100 border border-green-300 rounded text-center">
                  <p className="text-sm font-medium text-green-800">
                    Customer Saves: {currencySymbol}
                    {(formData.totalPrice - formData.sellingPrice).toFixed(2)}
                    {" "}(
                    {formData.discountType === "percentage"
                      ? `${formData.discountValue}%`
                      : `${currencySymbol}${formData.discountValue}`}{" "}
                    OFF)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="homepage">Show on Home Page (Combo)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable to show in the special Combo section
                  </p>
                </div>
                <Switch
                  id="homepage"
                  checked={formData.isComboHomePageEnabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isComboHomePageEnabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Product Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "draft") => {
                    // Validate minimum 2 products when activating
                    if (value === "active" && formData.items.length < 2) {
                      toast.error("Combo product must have at least 2 products to activate");
                      return;
                    }
                    setFormData((prev) => ({ ...prev, status: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.status === "active"
                    ? "Combo will be visible on the website"
                    : "Combo will be saved as draft"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>SEO Information</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSEO}
                disabled={isGeneratingSEO}
                className="h-8 border-purple-200 hover:bg-purple-50 text-purple-700 font-medium"
              >
                {isGeneratingSEO ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto Generate
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                  placeholder="SEO optimized title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaDescription: e.target.value,
                    }))
                  }
                  placeholder="SEO optimized description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))
                  }
                  placeholder="Keywords separated by commas"
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="freeShipping">Free Shipping</Label>
                <Switch
                  id="freeShipping"
                  checked={formData.freeShipping}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, freeShipping: checked }))
                  }
                />
              </div>
              
              {!formData.freeShipping && (
                <div className="space-y-2">
                  <Label htmlFor="shippingCharge">Shipping Charge</Label>
                  <Input
                    id="shippingCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCharge}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shippingCharge: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="codAvailable">COD Available</Label>
                <Switch
                  id="codAvailable"
                  checked={formData.isCODAvailable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isCODAvailable: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* GST & Tax */}
          <Card>
            <CardHeader>
              <CardTitle>GST & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                <Select
                  value={formData.gstPercentage?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      gstPercentage: parseFloat(value),
                    }))
                  }
                  disabled={isLoadingGST}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingGST
                          ? "Loading GST rates..."
                          : "Select GST rate"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">NIL (0%)</SelectItem>
                    {gstRates.map((rate) => (
                      <SelectItem
                        key={rate.id}
                        value={rate.gstPercentage.toString()}
                      >
                        {rate.name} - {rate.gstPercentage}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input
                  id="hsnCode"
                  value={formData.hsnCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hsnCode: e.target.value }))
                  }
                  placeholder="Enter HSN code"
                />
              </div>
            </CardContent>
          </Card>

          {/* Return & Warranty */}
          <Card>
            <CardHeader>
              <CardTitle>Return & Warranty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Switch
                  id="returnPolicy"
                  checked={formData.returnPolicyApplicable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, returnPolicyApplicable: checked }))
                  }
                />
              </div>

              {formData.returnPolicyApplicable && (
                <div className="space-y-2">
                  <Label htmlFor="returnDays">Return Window (Days)</Label>
                  <Input
                    id="returnDays"
                    type="number"
                    min="0"
                    value={formData.returnWindowDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        returnWindowDays: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="warranty">Warranty Details</Label>
                <Textarea
                  id="warranty"
                  placeholder="Enter warranty information..."
                  value={formData.warrantyDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, warrantyDetails: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
