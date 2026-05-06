"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  X,
  Image as ImageIcon,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { formatSmartUOMDisplay } from "@/lib/uom-constants";
import { ecommerceProductService } from "@/services/online-services/ecommerceProductService";
import DeleteModal from "../online/delete-modal";

// Mock data structure - replace with actual API calls
interface ComboProduct {
  id: string;
  comboName: string;
  comboDescription: string;
  comboImage?: string;
  items: Array<{
    productId: string;
    variantIndex: number;
    quantity: number;
    productName: string;
    variantName: string;
    variantImage?: string;
    variantPrice: number;
    variantUom?: string;
    variantUomValue?: number;
    category: string;
  }>;
  totalPrice: number;
  sellingPrice: number;
  discountType: "percentage" | "flat";
  discountValue: number;
  status: "active" | "draft";
  createdAt: string;
  updatedAt: string;
}

export default function ComboProductlist() {
  const router = useRouter();
  const currencySymbol = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comboProducts, setComboProducts] = useState<ComboProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCombo, setDeletingCombo] = useState<ComboProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch combo products
  useEffect(() => {
    fetchComboProducts();
  }, [searchTerm, statusFilter, categoryFilter]);

  const fetchComboProducts = async () => {
    setIsLoading(true);
    try {
      const response = await ecommerceProductService.getProducts({
        page: 1,
        limit: 100,
        type: "combo",
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as "active" | "draft") : undefined,
      });
      
      if (response.success) {
        // Filter and map combo products - only show products with comboItems
        const mappedData: ComboProduct[] = response.data
          .filter((p: any) => {
            // Only include products that have comboItems array with at least one item
            const hasComboItems = Array.isArray(p.comboItems) && p.comboItems.length > 0;
            return hasComboItems;
          })
          .map((p: any) => {
          // Parse comboItems
          let items: any[] = [];
          try {
            items = typeof p.comboItems === 'string' 
              ? JSON.parse(p.comboItems) 
              : p.comboItems || [];
          } catch (e) {
            console.warn("Failed to parse combo items for", p.id);
          }

          return {
            id: p.id,
            comboName: (p.variants && p.variants[0] && p.variants[0].displayName) || p.itemName || p.shortDescription || "Combo Product",
            comboDescription: p.shortDescription || "",
            comboImage: p.thumbnail,
            items: items.map((item: any) => ({
              productId: item.productId,
              variantIndex: item.variantIndex || 0,
              quantity: item.quantity || 1,
              productName: item.productName || "Product Item",
              variantName: item.variantName || "Variant",
              variantImage: item.variantImage || "",
              variantPrice: item.variantPrice || 0,
              variantUom: item.variantUom,
              variantUomValue: item.variantUomValue,
              category: p.category || "Miscellaneous"
            })),
            totalPrice: p.defaultMRP,
            sellingPrice: p.defaultSellingPrice,
            discountType: p.discountType === "Percent" ? "percentage" : "flat",
            discountValue: p.defaultDiscountValue,
            status: p.productStatus,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          };
        });

        setComboProducts(mappedData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(response.data.map((p: any) => p.category))
        ).sort() as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching combo products:", error);
      toast.error("Failed to load combo products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComboProduct = () => {
    router.push("/dashboard/products-list/combo/add");
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/products-list/combo/edit/${id}`);
  };

  const handleDelete = (combo: ComboProduct) => {
    setDeletingCombo(combo);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCombo) return;

    try {
      setIsDeleting(true);
      await ecommerceProductService.deleteProduct(deletingCombo.id);
      toast.success("Combo product deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingCombo(null);
      fetchComboProducts();
    } catch (error) {
      console.error("Error deleting combo product:", error);
      toast.error("Failed to delete combo product");
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateSavings = (combo: ComboProduct) => {
    const savings = combo.totalPrice - combo.sellingPrice;
    const percentage = combo.totalPrice > 0 ? (savings / combo.totalPrice) * 100 : 0;
    return { savings, percentage };
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search combo products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm sm:text-base"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm">
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
          )}

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="hidden sm:flex text-sm"
              size="sm"
            >
              Clear All
            </Button>
          )}

          <Button
            onClick={handleAddComboProduct}
            className="w-full sm:w-auto text-sm"
            size="sm"
          >
            <Plus className="size-4 mr-1" />
            Add Combo Product
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead className="min-w-[200px]">Combo Name</TableHead>
              <TableHead className="min-w-[150px]">Items</TableHead>
              <TableHead className="min-w-[120px]">Total Price</TableHead>
              <TableHead className="min-w-[120px]">Selling Price</TableHead>
              <TableHead className="min-w-[100px]">Savings</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Created</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading combo products...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : comboProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="size-12 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                        ? "No combo products found matching your filters."
                        : "No combo products available. Click 'Add Combo Product' to get started."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              comboProducts.map((combo) => {
                const { savings, percentage } = calculateSavings(combo);
                // Only use combo's main thumbnail image, don't fallback to item images
                const mainImage = combo.comboImage && combo.comboImage.trim() !== '' ? combo.comboImage : null;

                return (
                  <TableRow key={combo.id}>
                    {/* Image */}
                    <TableCell>
                      <div className="size-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={mainImage}
                            alt={combo.comboName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>

                    {/* Combo Name */}
                    <TableCell className="font-medium">
                      <div className="max-w-[200px]">
                        <div className="truncate">{combo.comboName}</div>
                        {combo.comboDescription && (
                          <div className="text-xs text-muted-foreground truncate">
                            {combo.comboDescription}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Items */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{combo.items.length} items</div>
                        <div className="text-xs text-muted-foreground">
                          {combo.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="truncate">
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                          {combo.items.length > 2 && (
                            <div className="text-primary">
                              +{combo.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Total Price */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {currencySymbol}
                          {combo.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Selling Price */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-primary">
                          {currencySymbol}
                          {combo.sellingPrice.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Savings */}
                    <TableCell>
                      {savings > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-green-600">
                            {currencySymbol}
                            {savings.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({percentage.toFixed(1)}% off)
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={combo.status === "active" ? "default" : "secondary"}
                      >
                        {combo.status === "active" ? "Active" : "Draft"}
                      </Badge>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell>
                      {new Date(combo.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(combo.id)}
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(combo)}
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comboProducts.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <Package className="size-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No combo products found"
                : "No combo products yet"}
            </p>
          </div>
        ) : (
          comboProducts.map((combo) => {
            const { savings, percentage } = calculateSavings(combo);
            // Only use combo's main thumbnail image, don't fallback to item images
            const mainImage = combo.comboImage && combo.comboImage.trim() !== '' ? combo.comboImage : null;

            return (
              <div key={combo.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-16 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={combo.comboName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{combo.comboName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {combo.items.length} items
                    </p>
                    <Badge
                      variant={combo.status === "active" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {combo.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Price</p>
                    <p className="font-medium">
                      {currencySymbol}
                      {combo.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Selling Price</p>
                    <p className="font-medium text-primary">
                      {currencySymbol}
                      {combo.sellingPrice.toFixed(2)}
                    </p>
                  </div>
                  {savings > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Savings</p>
                      <p className="font-medium text-green-600">
                        {currencySymbol}
                        {savings.toFixed(2)} ({percentage.toFixed(1)}% off)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(combo.id)}
                  >
                    <Edit className="size-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(combo)}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setDeletingCombo(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        productName={deletingCombo?.comboName || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}
